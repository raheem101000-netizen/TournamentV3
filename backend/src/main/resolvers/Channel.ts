import { createResolvers } from '@/src/main/axolotl.js';
import {
  PageInfo,
  PageInput,
  UploadResponse,
  AttachmentUrl,
  MessageSortByInput,
  SortDirection,
  MessageSortFields,
} from '@/src/main/models.js';
import { ChannelModel, MongoOrb, MessageModel, UserModel } from '@/src/main/orm.js';
import AuthorizedUserMutation from '@/src/main/resolvers/AuthorizedUserMutation.js';
import { getPutURL, getGETUrl, getS3Key } from '@/src/main/shared/s3.js';
import { generateAttachmentsUrls } from '../helpers/generateAttachmentsUrls.js';
import { Filter } from 'mongodb';

const SORT_DIRECTION: Record<SortDirection, -1 | 1> = {
  ASC: 1,
  DESC: -1,
};

const MESSAGE_FIELDS_FILTER: Record<MessageSortFields, string> = {
  CREATED_AT: 'createdAt',
};

export default createResolvers({
  Channel: {
    server: async ([source]) => {
      const src = source as ChannelModel;
      const e = await MongoOrb('ServerCollection').collection.findOne({
        _id: src.server,
      });
      return e;
    },
    messages: async ([source], args) => {
      const src = source as ChannelModel;
      return {
        channelId: src._id,
        ...args,
      };
    },
  },
  MessageConnection: {
    messages: async ([source, {}, ctx]) => {
      const src = source as { channelId: string; page: PageInput; messageId?: string; sortBy: MessageSortByInput };
      const { user } = ctx as { user?: UserModel };
      const filter: Filter<MessageModel> = messageFilter({ user, channelId: src.channelId });

      const result = await MongoOrb('MessageCollection')
        .collection.find(filter)
        .sort(
          src.sortBy?.field
            ? { [MESSAGE_FIELDS_FILTER[src.sortBy.field]]: SORT_DIRECTION[src.sortBy.direction ?? SortDirection.DESC] }
            : { createdAt: -1 },
        )
        .skip(src.page.start || 0)
        .limit(src.page.limit)
        .toArray();

      return result;
    },
    pageInfo: async ([source]) => {
      const src = source as { channelId: string; page: PageInput };
      const count = await MongoOrb('MessageCollection').collection.countDocuments({
        channel: src.channelId,
      });
      return {
        total: count,
        hasNext: (src.page?.start || 0) + (src.page?.limit || 0) < count,
      } satisfies PageInfo;
    },
  },
  Message: {
    channel: async ([source]) => {
      const src = source as MessageModel;
      return MongoOrb('ChannelCollection').collection.findOne({
        _id: src.channel,
      });
    },
    user: async ([source]) => {
      const src = source as MessageModel;
      return MongoOrb('UserCollection').collection.findOne({
        _id: src.user,
      });
    },
    replies: async ([source], args) => {
      const src = source as MessageModel;
      return {
        messageId: src._id,
        channelId: src.channel,
        ...args,
      };
    },
    attachmentsUrls: async ([source]) => {
      const src = source as MessageModel;

      // TODO: delete in future
      let toModify = false;

      const result = src.attachmentsUrls?.map((attachmentsUrl): AttachmentUrl => {
        if (
          attachmentsUrl.image &&
          attachmentsUrl.image_thumbnail &&
          (attachmentsUrl.image?.split('?').length === 2 ||
            attachmentsUrl.image?.split('digitaloceanspaces.com/').length !== 1)
        ) {
          toModify = true;
          return {
            image: getS3Key(attachmentsUrl.image),
            image_thumbnail: getS3Key(attachmentsUrl.image_thumbnail),
          };
        }
        return attachmentsUrl;
      });

      if (toModify) {
        await MongoOrb('MessageCollection').collection.findOneAndUpdate(
          {
            _id: src._id,
          },
          {
            $set: {
              attachmentsUrls: result,
            },
          },
        );
      }

      const resultFromGetUrl = result?.map(
        async (url): Promise<AttachmentUrl> => ({
          ...(url.image && { image: await getGETUrl(decodeURIComponent(url.image)) }),
          ...(url.image_thumbnail && { image_thumbnail: await getGETUrl(decodeURIComponent(url.image_thumbnail)) }),
        }),
      );

      return resultFromGetUrl;
    },
  },
  ChannelOps: {
    delete: async ([source]) => {
      const src = source as ChannelModel;
      await MongoOrb('MessageCollection').collection.deleteMany({
        channel: src._id,
      });
      await MongoOrb('ChannelCollection').collection.deleteOne({
        _id: src._id,
      });
      return true;
    },
    update: async ([source], args) => {
      const src = source as ChannelModel;
      const result = await MongoOrb('ChannelCollection').collection.updateOne(
        { _id: src._id },
        {
          $set: args.channel,
        },
      );
      return result.acknowledged;
    },
  },
  UserChannelOps: {
    uploadFile: async ([source], args) => {
      const src = source as ReturnType<typeof AuthorizedUserMutation.AuthorizedUserMutation.channel> extends Promise<
        infer R
      >
        ? R
        : never;
      const compiledKey = `channel/${src.channel._id}/${args.key}/image`;
      const putURL = await getPutURL(compiledKey);
      const getURL = await getGETUrl(compiledKey);

      return {
        getURL,
        putURL,
        key: compiledKey,
      } satisfies UploadResponse;
    },
    sendMessage: async ([source], args) => {
      const src = source as ReturnType<typeof AuthorizedUserMutation.AuthorizedUserMutation.channel> extends Promise<
        infer R
      >
        ? R
        : never;

      const images = args.message.attachmentsUrls;
      const generatedUrls: AttachmentUrl[] = await generateAttachmentsUrls(images);
      const attachmentsUrls = generatedUrls.map(
        (url): AttachmentUrl => ({
          ...(url.image && { image: getS3Key(url.image) }),
          ...(url.image_thumbnail && { image_thumbnail: getS3Key(url.image_thumbnail) }),
        }),
      );

      const result = await MongoOrb('MessageCollection').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        channel: src.channel._id,
        user: src.user._id,
        attachmentsUrls,
        text: args.message.text,
      });

      return result.acknowledged;
    },
  },
});

type MessageFilterProps = {
  user?: UserModel;
  channelId?: string;
};

const messageFilter = ({ user, channelId }: MessageFilterProps): Filter<MessageModel> => {
  const blockedUsers = user?.blockedUsers?.filter((el): el is string => typeof el === 'string');

  return {
    ...(blockedUsers
      ? {
          user: {
            $nin: blockedUsers,
          },
        }
      : {}),
    ...(channelId
      ? {
          channel: channelId,
        }
      : {}),
  };
};
