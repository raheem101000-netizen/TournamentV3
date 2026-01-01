import { createResolvers } from '@/src/main/axolotl.js';
import { MongoOrb, UserModel } from '@/src/main/orm.js';
import { getPutURL, getGETUrl } from '@/src/main/shared/s3.js';
import { UploadResponse } from '@/src/models.js';
import { GraphQLError } from 'graphql';

export default createResolvers({
  AuthorizedUserMutation: {
    organisator: async ([source]) => {
      const src = source as UserModel;
      if (!src.isOrganisator) throw new Error('Unauthorized access! Section only for Server organisators');
      return src;
    },
    channel: async ([source], args) => {
      const src = source as UserModel;
      const channel = await MongoOrb('ChannelCollection').collection.findOne({
        _id: args.channelId,
      });
      if (!channel) throw new GraphQLError('Channel does not exist');
      return {
        channel,
        user: src,
      };
    },
    followServer: async ([source], args) => {
      const src = source as UserModel;
      if (args.follow) {
        await MongoOrb('ServerCollection').collection.updateOne(
          { _id: args.serverId },
          {
            $push: {
              interestedUsers: src._id,
            },
          },
        );
      } else {
        await MongoOrb('ServerCollection').collection.updateOne(
          { _id: args.serverId },
          {
            $pull: {
              interestedUsers: src._id,
            },
          },
        );
      }
      return true;
    },
    makeMeOrganisator: async ([source]) => {
      const src = source as UserModel;
      if (src.isOrganisator) return false;
      const result = await MongoOrb('UserCollection').collection.updateOne(
        { _id: src._id },
        {
          $set: {
            isOrganisator: true,
          },
        },
      );
      return result.acknowledged;
    },
    uploadFile: async ([source], args) => {
      const src = source as UserModel;
      const compiledKey = `users/${src._id}/${args.key}`;

      const putURL = await getPutURL(compiledKey);
      const getURL = await getGETUrl(compiledKey);

      return {
        getURL,
        putURL,
        key: compiledKey,
      } satisfies UploadResponse;
    },
    blockUser: async ([source], args) => {
      const src = source as UserModel;
      await MongoOrb('UserCollection').collection.updateOne(
        { _id: src._id },
        args.block
          ? {
              $push: {
                blockedUsers: args.userId,
              },
            }
          : {
              $pull: {
                blockedUsers: args.userId,
              },
            },
      );
      return true;
    },
  },
});
