import { useQuery } from "@apollo/client"
import { useRouter } from "expo-router"

import { GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useAuth } from "@/providers/AuthProvider"

import { storeTokens } from "../../../providers/ApolloProvider/helpers/storage"

export const useInitRedirect = () => {
  const { replace } = useRouter()
  const { setIsLogged } = useAuth()
  return useQuery(GET_USER, {
    client,
    fetchPolicy: "network-only",
    onError: async err => {
      if (err.message === "Network request failed") return
      storeTokens({
        refreshToken: undefined,
        token: undefined,
      })
      setIsLogged(false)
      replace("/auth/AuthScreen")
    },

    onCompleted: ({ users }) => {
      if (users?.user?.me?._id) {
        setIsLogged(true)
        return replace("/main/tabs/Home")
      }
      replace("/auth/AuthScreen")
    },
  })
}
