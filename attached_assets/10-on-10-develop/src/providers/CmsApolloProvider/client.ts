import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

const httpLink = new HttpLink({ uri: process.env.EXPO_PUBLIC_CMS_API_URL })

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        users: {
          merge(existing = {}, incoming) {
            return {
              ...existing,
              ...incoming,
            }
          },
        },
      },
    },
  },
})

export const cmsClient = new ApolloClient({
  link: httpLink,
  cache,
})
