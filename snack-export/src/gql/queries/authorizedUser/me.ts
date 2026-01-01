import { $, FromSelector, Selector } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

import { ServerSelector } from "../selectors"

const User = Selector("User")({
  _id: true,
  fullName: true,
  isOrganisator: true,
  username: true,
  avatarUrl: true,
  blockedUsers: true,
})

export const GET_USER = typedGql("query")({
  users: {
    user: {
      me: User,
    },
  },
})

export const GET_MY_SERVERS = typedGql("query")({
  users: {
    user: {
      me: {
        followedServers: [
          { pageInput: $("pageInput", "PageInput!") },
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

export type UserSelector = FromSelector<typeof User, "User">
