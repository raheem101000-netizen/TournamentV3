import { createResolvers } from '@/src/main/axolotl.js';
import { FullServersFilter, MongoOrb, UserModel } from '@/src/main/orm.js';
import AuthorizedUserMutation from '@/src/main/resolvers/AuthorizedUserMutation.js';
import AuthorizedUserQuery from '@/src/main/resolvers/AuthorizedUserQuery.js';
import Channel from '@/src/main/resolvers/Channel.js';
import Server from '@/src/main/resolvers/Server.js';
import GuestQuery from '@/src/main/resolvers/GuestQuery.js';
import { getGETUrl } from '@/src/main/shared/s3.js';
import { GraphQLError } from 'graphql';

export default createResolvers({
  ...AuthorizedUserQuery,
  ...AuthorizedUserMutation,
  ...Channel,
  ...Server,
  ...GuestQuery,
  User: {
    followedServers: async ([source], args) => {
      const src = source as UserModel;
      return {
        interestedUserId: src._id,
        pageInput: args.pageInput,
      } satisfies FullServersFilter;
    },
    avatarUrl: async ([source]) => {
      const src = source as UserModel;
      if (!src.avatarUrl) return;
      const compiledKey = `users/${src._id}/${src.avatarUrl}`;
      const url = await getGETUrl(compiledKey);
      return url;
    },
  },
  OrganisatorQuery: {
    myServers: async ([source], args) => {
      const src = source as UserModel;
      return {
        ...args.filter,
        hostId: src._id,
      };
    },
  },
  OrganisatorMutation: {
    serverOps: async ([source], args) => {
      const src = source as UserModel;
      const hostedServer = await MongoOrb('ServerCollection').collection.findOne({
        host: src._id,
        _id: args.serverId,
      });
      if (!hostedServer) throw new GraphQLError('This is not your Server!');
      return hostedServer;
    },
    createServer: async ([source], args) => {
      const src = source as UserModel;
      const result = await MongoOrb('ServerCollection').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        ...args.server,
        interestedUsers: [],
        host: src._id,
      });
      return result.insertedId;
    },
  },
});
