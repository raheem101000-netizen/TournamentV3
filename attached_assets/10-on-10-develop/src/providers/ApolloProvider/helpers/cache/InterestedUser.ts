import { TypePolicies } from "@apollo/client"

export const InterestedUser: TypePolicies = {
  Server: {
    merge(_, incoming) {
      return incoming
    },
  },
}
