import { createResolvers } from '@/src/main/axolotl.js';
import { MongoOrb, UserModel } from '@/src/main/orm.js';

export default createResolvers({
  AuthorizedUserQuery: {
    channelById: async (_, args) => {
      return MongoOrb('ChannelCollection').collection.findOne({
        _id: args.channelId,
      });
    },
    organisator: async ([source]) => {
      const src = source as UserModel;
      if (!src.isOrganisator) throw new Error('Unauthorized access! Section only for Server organisators');
      return src;
    },
  },
});
