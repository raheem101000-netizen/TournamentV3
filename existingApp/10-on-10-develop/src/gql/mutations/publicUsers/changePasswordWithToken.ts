import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const CHANGE_PASSWORD_WITH_TOKEN = typedGql("mutation")({
  users: {
    publicUsers: {
      changePasswordWithToken: [
        { token: $("token", "ChangePasswordWithTokenInput!") },
        {
          hasError: true,
          result: true,
        },
      ],
    },
  },
})
