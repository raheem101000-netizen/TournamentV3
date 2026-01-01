import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const EDIT_USER = typedGql("mutation")({
  users: {
    user: {
      editUser: [
        { updatedUser: $("updateUserInput", "UpdateUserInput!") },
        {
          hasError: true,
          result: true,
        },
      ],
    },
  },
})
