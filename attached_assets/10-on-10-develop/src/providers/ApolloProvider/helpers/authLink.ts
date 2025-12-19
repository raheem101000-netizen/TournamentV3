import { setContext } from "@apollo/client/link/context"

import { getTokens } from "./storage"

export const authLink = setContext(async ({ query }) => {
  const tokens = await getTokens()

  if (query.loc?.source.body.includes("refreshToken")) return

  return {
    headers: {
      authorization: tokens?.token ? tokens.token : "",
    },
  }
})
