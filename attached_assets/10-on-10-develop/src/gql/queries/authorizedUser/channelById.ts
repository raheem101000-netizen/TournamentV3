import { $, FromSelector, Selector } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

const PageInfo = Selector("PageInfo")({
  hasNext: true,
  total: true,
})

const MessageDetails = Selector("Message")({
  _id: true,
  text: true,
  createdAt: true,
  attachmentsUrls: {
    image: true,
    image_thumbnail: true,
  },
  user: {
    _id: true,
    fullName: true,
    isOrganisator: true,
    username: true,
    avatarUrl: true,
  },
})

const ChannelDetails = Selector("Channel")({
  name: true,
  description: true,
  tournament: true,
  open: true,
  server: {
    host: {
      _id: true,
    },
  },
})

export const GET_CHANNEL_DETAILS = typedGql("query")({
  users: {
    user: {
      channelById: [{ channelId: $("channelId", "String!") }, ChannelDetails],
    },
  },
})

export const GET_CHANNEL_MESSAGES = typedGql("query")({
  users: {
    user: {
      channelById: [
        { channelId: $("channelId", "String!") },
        {
          messages: [
            { page: $("messageInput", "PageInput!"), sortBy: $("sortBy", "MessageSortByInput") },
            {
              messages: MessageDetails,
              pageInfo: PageInfo,
            },
          ],
        },
      ],
    },
  },
})

export type ChannelDetailsSelector = FromSelector<typeof ChannelDetails, "Channel">
export type MessageDetailsSelector = FromSelector<typeof MessageDetails, "Message">
