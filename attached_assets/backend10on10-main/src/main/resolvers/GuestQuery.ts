import { createResolvers } from '@/src/main/axolotl.js';
import { FullServersFilter, MongoOrb } from '@/src/main/orm.js';

export default createResolvers({
  PublicUsersQuery: {
    guest: () => ({}),
  },
  GuestQuery: {
    categories: async (_, args) => {
      return args.pageInput;
    },
    serversByCategory: (_, args) => {
      return {
        categorySlug: args.categorySlug,
        pageInput: args.filter.pageInput,
        search: args.filter.search,
      } satisfies FullServersFilter;
    },
    serverById: async (_, args) => {
      return await MongoOrb('ServerCollection').collection.findOne({
        _id: args.serverId,
      });
    },
  },
});
