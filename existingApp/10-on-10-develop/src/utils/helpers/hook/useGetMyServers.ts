import { useQuery } from "@apollo/client"
import { useIsFocused } from "@react-navigation/native"
import { useCallback } from "react"

import { GET_MY_SERVERS } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { SERVER_FETCH_LIMIT } from "@/utils/constants"

export const useGetMyServers = () => {
  const isFocused = useIsFocused()

  const {
    data,
    loading: loadingServers,
    fetchMore,
    refetch,
  } = useQuery(GET_MY_SERVERS, {
    skip: !isFocused,
    client,
    variables: {
      pageInput: {
        limit: SERVER_FETCH_LIMIT,
        start: 0,
      },
    },
  })

  const serversResponse = data?.users?.user?.me?.followedServers

  const fetchMoreServers = useCallback(() => {
    if (!serversResponse || loadingServers) return
    const { servers, pageInfo } = serversResponse
    if (!pageInfo?.hasNext) return
    fetchMore({
      variables: {
        pageInput: {
          limit: SERVER_FETCH_LIMIT,
          start: servers.length,
        },
      },
    })
  }, [loadingServers, serversResponse, fetchMore])

  return {
    servers: serversResponse?.servers ?? [],
    loadingServers,
    totalServers: serversResponse?.pageInfo?.total,
    hasNextPage: !!serversResponse?.pageInfo?.hasNext,
    refetchServers: refetch,
    fetchMoreServers,
  }
}
