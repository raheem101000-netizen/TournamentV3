import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const UPLOAD_IMAGE = typedGql("mutation")({
  users: {
    user: {
      uploadFile: [{ key: $("imageKey", "String!") }, { putURL: true }],
    },
  },
})
