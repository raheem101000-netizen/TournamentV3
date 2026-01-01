import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const USER_LOGIN = typedGql("query")({
  users: {
    publicUsers: {
      login: {
        password: [
          { user: $("user", "LoginInput!") },
          { accessToken: true, hasError: true, refreshToken: true },
        ],
      },
    },
  },
})
