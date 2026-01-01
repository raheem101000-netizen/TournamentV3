import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

import { ServersByCategorySelector } from "../selectors"

export const SERVERS_BY_CATEGORY = typedGql("query")({
  users: {
    publicUsers: {
      guest: {
        serversByCategory: [
          {
            filter: $("filter", "ServersFilter!"),
            categorySlug: $("categorySlug", "String"),
          },
          {
            servers: ServersByCategorySelector,
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
