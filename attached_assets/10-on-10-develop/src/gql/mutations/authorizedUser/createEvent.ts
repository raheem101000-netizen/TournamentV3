import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const CREATE_SERVER = typedGql("mutation")({
  users: {
    user: {
      organisator: {
        createServer: [{ server: $("server", "CreateServer!") }, true],
      },
    },
  },
})
