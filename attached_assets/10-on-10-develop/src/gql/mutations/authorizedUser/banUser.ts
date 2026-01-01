import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const BAN_USER = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            banUser: [{ userId: $("userId", "String!") }, true],
          },
        ],
      },
    },
  },
})
export const UN_BAN_USER = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            unbanUser: [{ userId: $("userId", "String!") }, true],
          },
        ],
      },
    },
  },
})
