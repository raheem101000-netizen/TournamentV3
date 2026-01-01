import { ApolloProvider as _ApolloProvider } from "@apollo/client"
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev"
import { PropsWithChildren } from "react"

import { client } from "./helpers/client"

if (__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages()
  loadErrorMessages()
}

export const ApolloProvider = ({ children }: PropsWithChildren) => {
  return <_ApolloProvider client={client}>{children}</_ApolloProvider>
}
