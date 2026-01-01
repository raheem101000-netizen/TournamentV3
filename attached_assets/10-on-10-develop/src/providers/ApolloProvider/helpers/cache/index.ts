import { InMemoryCache } from "@apollo/client"

import { FollowedServers } from "./FollowedServers"
import { GuestQuery } from "./GuestQuery"
import { InterestedUser } from "./InterestedUser"
import { OrganisatorQuery } from "./OrganisatorQuery"
import { Query } from "./Query"
import { Server } from "./Server"

export const cache = new InMemoryCache({
  possibleTypes: {
    UserFollowedServer: ["followedServers"],
  },
  typePolicies: {
    ...Query,
    ...GuestQuery,
    ...OrganisatorQuery,
    ...FollowedServers,
    ...Server,
    ...InterestedUser,
  },
  dataIdFromObject(responseObject) {
    switch (responseObject.__typename) {
      case "Category":
        return `Category:${responseObject.slug}`
      case "Server":
        return `Server:${responseObject._id}`
      case "GuestQuery":
        return "GuestQuery"
      case "OrganisatorQuery":
        return "OrganisatorQuery"
      case "User": {
        if (responseObject.followedServers) {
          return "UserFollowedServer"
        }
        return `User:${responseObject._id}`
      }
    }
  },
})
