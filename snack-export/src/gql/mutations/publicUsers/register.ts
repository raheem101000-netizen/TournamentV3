import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const REGISTER = typedGql("mutation")({
  users: {
    publicUsers: {
      register: [{ user: $("user", "RegisterInput!") }, { hasError: true, registered: true }],
    },
  },
})
