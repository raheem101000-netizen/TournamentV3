import { $, FromSelector, Selector } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

const ChannelSelector = Selector("Channel")({
  name: true,
  open: true,
  description: true,
  _id: true,
  tournament: true,
})

const GetServerByIdSelector = Selector("Server")({
  title: true,
  description: true,
  iAmInterested: true,
  category: {
    slug: true,
    name: true,
  },
  host: {
    _id: true,
    username: true,
  },
  interestedUsers: {
    fullName: true,
    _id: true,
    banned: true,
    blockedByUser: true,
  },
})

export const GET_SERVER_BY_ID = typedGql("query")({
  users: {
    publicUsers: {
      guest: {
        serverById: [{ serverId: $("serverId", "String!") }, GetServerByIdSelector],
      },
    },
  },
})

export const GET_CHANNELS_BY_SERVER_ID = typedGql("query")({
  users: {
    publicUsers: {
      guest: {
        serverById: [
          { serverId: $("serverId", "String!") },
          {
            _id: true,
            channels: ChannelSelector,
          },
        ],
      },
    },
  },
})

export type ServerByIdProps = FromSelector<typeof GetServerByIdSelector, "Server">
export type ChannelProps = FromSelector<typeof ChannelSelector, "Channel">
