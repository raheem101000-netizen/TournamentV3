import { ApolloClient, FetchResult, from, HttpLink, Observable } from "@apollo/client"
import { onError } from "@apollo/client/link/error"

import { REFRESH_TOKEN } from "@/gql"
import { getTokens, storeTokens } from "@/utils/helpers"

import { authLink } from "./authLink"
import { cache } from "./cache"

const httpLink = new HttpLink({ uri: process.env.EXPO_PUBLIC_API_URL })

const ERRORS = ["You are not logged in", "jwt expired"]

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (!graphQLErrors) return
  for (const { message } of graphQLErrors) {
    if (!ERRORS.includes(message)) return

    const observable = new Observable<FetchResult>(observer => {
      const init = async () => {
        try {
          const authorization = await refreshToken()

          operation.setContext({
            ...operation.getContext(),
            headers: {
              authorization,
            },
          })
          forward(operation).subscribe({
            error: error => observer.error(error),
            next: next => observer.next(next),
            complete: () => observer.complete(),
          })
        } catch (err) {
          observer.error(err)
        }
      }
      init()
    })
    return observable
  }
})

export const client = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache,
})

const refreshToken = async () => {
  const authDetails = await getTokens()

  if (!authDetails?.refreshToken) return
  const { data } = await client.query({
    query: REFRESH_TOKEN,
    variables: { refreshToken: authDetails.refreshToken },
    fetchPolicy: "network-only",
  })

  await storeTokens({
    token: data.users?.publicUsers?.login.refreshToken,
  })

  return data.users?.publicUsers?.login.refreshToken
}
