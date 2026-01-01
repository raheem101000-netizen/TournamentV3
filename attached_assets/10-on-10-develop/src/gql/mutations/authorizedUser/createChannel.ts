import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const CREATE_CHANNEL = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            createChannel: [{ channel: $("channelDetails", "CreateChannelInput!") }, true],
          },
        ],
      },
    },
  },
})
