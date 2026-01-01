import { Channel, Server, Message, User, ServersFilter } from '@/src/main/models.js';
import { iGraphQL, MongoModel } from 'i-graphql';
import { ObjectId } from 'mongodb';

export type ServerModel = Omit<MongoModel<Server>, 'iAmInterested' | 'channels'>;
export type ChannelModel = Omit<MongoModel<Channel>, 'messages'>;
export type MessageModel = Omit<MongoModel<Message>, 'replies' | 'attachmentsUrls'> & {
  replyToMessageId?: string;
  attachmentsUrls: Message['attachmentsUrls'];
};
export type UserModel = MongoModel<User>;
export type BannedUserModel = {
  userId: string;
  bannedAt: string;
  serverId: string;
};

export const MongoOrb = await iGraphQL<
  {
    ServerCollection: ServerModel;
    ChannelCollection: ChannelModel;
    MessageCollection: MessageModel;
    UserCollection: UserModel;
    BannedUserCollection: BannedUserModel;
  },
  {
    _id: () => string;
    createdAt: () => string;
  }
>({
  autoFields: {
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date().toISOString(),
  },
});

export type FullServersFilter = ServersFilter & {
  categorySlug?: string;
  hostId?: string;
  interestedUserId?: string;
};
