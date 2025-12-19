import { TypePolicies } from "@apollo/client"

export const Query: TypePolicies = {
  Query: {
    fields: {
      users: {
        merge(existing = {}, incoming, { mergeObjects }) {
          return mergeObjects(existing, incoming)
        },
      },
    },
  },
  AuthorizedUserQuery: {
    merge(existing = {}, incoming, { mergeObjects }) {
      return mergeObjects(existing, incoming)
    },
  },
  User: {
    merge(existing = {}, incoming, { mergeObjects }) {
      return mergeObjects(existing, incoming)
    },
  },
}
