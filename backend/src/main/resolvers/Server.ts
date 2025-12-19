import { getCategories } from '@/src/cms/cms.js';
import { createResolvers } from '@/src/main/axolotl.js';
import { ServersFilter, PageInfo, PageInput } from '@/src/main/models.js';
import { ServerModel, MongoOrb, UserModel, FullServersFilter } from '@/src/main/orm.js';
import { Filter } from 'mongodb';

export default createResolvers({
  CategoryConnection: {
    categories: async ([source]) => {
      const src = source as PageInput | undefined;
      const all = await getCategories();
      if (!src) return all;
      return all.slice(src.start || 0, (src.start || 0) + src.limit);
    },
    pageInfo: async ([source]) => {
      const src = source as PageInput | undefined;
      const all = await getCategories();
      const count = all.length;
      return {
        total: count,
        hasNext: (src?.start || 0) + (src?.limit || 0) < count,
      } satisfies PageInfo;
    },
  },
  ServerConnection: {
    servers: async ([source]) => {
      const src = source as ServersFilter;
      const filter: Filter<ServerModel> = constructServerFilter(src);
      return await MongoOrb('ServerCollection')
        .collection.find(filter)
        .sort({ createdAt: -1 })
        .skip(src.pageInput?.start || 0)
        .limit(src.pageInput?.limit || 10)
        .toArray();
    },
    pageInfo: async ([source]) => {
      const src = source as ServersFilter;
      const filter: Filter<ServerModel> = constructServerFilter(src);
      const count = await MongoOrb('ServerCollection').collection.countDocuments(filter);
      return {
        total: count,
        hasNext: (src.pageInput?.start || 0) + (src.pageInput?.limit || 0) < count,
      } satisfies PageInfo;
    },
  },
  Server: {
    category: async ([source]) => {
      const src = source as ServerModel;
      const all = await getCategories();
      return all.find((a) => a.slug === src.category);
    },
    channels: async ([source]) => {
      const src = source as ServerModel;
      return await MongoOrb('ChannelCollection')
        .collection.find({
          server: src._id,
        })
        .toArray();
    },
    iAmInterested: async ([source, {}, ctx]) => {
      const src = source as ServerModel;
      const context = ctx as { user?: UserModel };
      if (!src.interestedUsers?.length) return false;
      if (!context.user?._id) return false;
      if (src.interestedUsers.includes(context.user._id)) return true;
    },
    interestedUsers: async ([source, {}, ctx]) => {
      const src = source as ServerModel;
      const { user } = ctx as { user?: UserModel };
      const result = await MongoOrb('BannedUserCollection')
        .collection.find({
          serverId: src._id,
        })
        .toArray();
      const bannedIds = result.map((r) => r.userId);
      if (!src.interestedUsers?.length) return [];
      const serverUsers = await MongoOrb('UserCollection')
        .collection.find({
          _id: {
            $in: src.interestedUsers,
          },
        })
        .toArray();
      return serverUsers.map((su) => ({
        ...su,
        banned: bannedIds.includes(su._id),
        blockedByUser: user?.blockedUsers?.includes(su._id),
      }));
    },
    host: async ([source]) => {
      const src = source as ServerModel;
      return await MongoOrb('UserCollection').collection.findOne({
        _id: src.host,
      });
    },
  },
  ServerOps: {
    banUser: async ([source], args) => {
      const src = source as ServerModel;
      const result = await MongoOrb('BannedUserCollection').collection.updateOne(
        {
          userId: args.userId,
          serverId: src._id,
        },
        {
          $set: {
            userId: args.userId,
            bannedAt: new Date().toISOString(),
            serverId: src._id,
          },
        },
        { upsert: true },
      );
      return result.acknowledged;
      // ban user
    },
    unbanUser: async ([source], args) => {
      const src = source as ServerModel;
      const result = await MongoOrb('BannedUserCollection').collection.deleteOne({
        userId: args.userId,
        serverId: src._id,
      });
      return result.acknowledged;
      // ban user
    },
    channelOps: async ([source], args) => {
      const src = source as ServerModel;
      return MongoOrb('ChannelCollection').collection.findOne({
        _id: args.channelId,
        server: src._id,
      });
    },
    createChannel: async ([source], args) => {
      const src = source as ServerModel;

      const result = await MongoOrb('ChannelCollection').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        server: src._id,
        ...args.channel,
      });
      return result.insertedId;
    },
    delete: async ([source]) => {
      const src = source as ServerModel;
      const associatedChannels = await MongoOrb('ChannelCollection')
        .collection.find({
          server: src._id,
        })
        .toArray();
      if (associatedChannels.length) {
        await MongoOrb('MessageCollection').collection.deleteMany({
          channel: {
            $in: associatedChannels.map((ch) => ch._id),
          },
        });
        await MongoOrb('ChannelCollection').collection.deleteMany({
          Server: src._id,
        });
      }
      const result = await MongoOrb('ServerCollection').collection.deleteOne({
        _id: src._id,
      });
      return result.acknowledged;
    },
    update: async ([source], args) => {
      const src = source as ServerModel;
      const result = await MongoOrb('ServerCollection').collection.updateOne(
        {
          _id: src._id,
        },
        {
          $set: args.server,
        },
      );
      return result.acknowledged;
    },
  },
});

const constructServerFilter = (src: FullServersFilter): Filter<ServerModel> => {
  return {
    ...(src.hostId
      ? {
          host: src.hostId,
        }
      : {}),
    ...(src.categorySlug
      ? {
          category: src.categorySlug,
        }
      : {}),
    ...(src.interestedUserId
      ? {
          interestedUsers: {
            $in: [src.interestedUserId],
          },
        }
      : {}),
    ...(src.search
      ? {
          title: {
            $regex: new RegExp(`${src.search}`, 'i'),
          },
        }
      : {}),
  };
};
