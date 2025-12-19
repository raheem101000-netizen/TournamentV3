import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const DELETE_SERVER = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        serverOps: [
          { serverId: $("serverId", "String!") },
          {
            delete: true,
          },
        ],
      },
    },
  },
})
