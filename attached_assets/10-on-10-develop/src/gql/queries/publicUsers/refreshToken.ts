import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const REFRESH_TOKEN = typedGql("query")({
  users: {
    publicUsers: {
      login: {
        refreshToken: [{ refreshToken: $("refreshToken", "String!") }, true],
      },
    },
  },
})
