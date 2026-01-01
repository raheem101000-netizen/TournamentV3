import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const REQUEST_FORGOT_PASSWORD = typedGql("query")({
  users: {
    publicUsers: {
      requestForForgotPassword: [{ username: $("username", "String!") }, true],
    },
  },
})
