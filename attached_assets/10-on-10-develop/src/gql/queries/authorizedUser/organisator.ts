import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

import { ServerSelector } from "../selectors"

export const GET_ORGANISATOR_MY_SERVERS = typedGql("query")({
  users: {
    user: {
      organisator: {
        myServers: [
          { filter: $("filter", "ServersFilter!") },
          {
            servers: ServerSelector,
            pageInfo: {
              hasNext: true,
              total: true,
            },
          },
        ],
      },
    },
  },
})
