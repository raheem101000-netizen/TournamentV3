import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const FOLLOW_SERVER = typedGql("mutation")({
  users: {
    user: {
      followServer: [{ serverId: $("serverId", "String!"), follow: $("follow", "Boolean") }, true],
    },
  },
})
