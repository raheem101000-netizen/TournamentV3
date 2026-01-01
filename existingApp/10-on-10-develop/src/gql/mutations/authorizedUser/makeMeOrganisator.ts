import { typedGql } from "@/zeus/typedDocumentNode"

export const MAKE_ME_OGRANISATOR = typedGql("mutation")({
  users: {
    user: {
      makeMeOrganisator: true,
    },
  },
})
