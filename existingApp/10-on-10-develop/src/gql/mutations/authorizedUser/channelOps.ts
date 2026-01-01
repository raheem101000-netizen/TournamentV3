import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const EDIT_CHANNEL = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            channelOps: [
              { channelId: $("channelId", "String!") },
              {
                update: [{ channel: $("channelDetails", "UpdateChannelInput!") }, true],
              },
            ],
          },
        ],
      },
    },
  },
})

export const DELETE_CHANNEL = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            channelOps: [
              { channelId: $("channelId", "String!") },
              {
                delete: true,
              },
            ],
          },
        ],
      },
    },
  },
})
