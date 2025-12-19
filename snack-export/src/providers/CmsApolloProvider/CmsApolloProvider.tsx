import { ApolloProvider } from "@apollo/client"
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev"
import { PropsWithChildren } from "react"

import { cmsClient } from "./client"

if (__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages()
  loadErrorMessages()
}

export const CmsApolloProvider = ({ children }: PropsWithChildren) => {
  return <ApolloProvider client={cmsClient}>{children}</ApolloProvider>
}
