import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const UPDATE_SERVER = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            update: [{ server: $("updateServer", "UpdateServer!") }, true],
          },
        ],
      },
    },
  },
})
