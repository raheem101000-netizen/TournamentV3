import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const BLOCK_USER = typedGql("mutation")({
  users: {
    user: {
      blockUser: [{ userId: $("userId", "String!"), block: $("block", "Boolean") }, true],
    },
  },
})
