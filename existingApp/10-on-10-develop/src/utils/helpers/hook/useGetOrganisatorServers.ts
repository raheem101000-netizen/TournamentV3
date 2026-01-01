import { useQuery } from "@apollo/client"
import { useIsFocused } from "@react-navigation/native"
import { useCallback } from "react"

import { GET_ORGANISATOR_MY_SERVERS } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { SERVER_FETCH_LIMIT } from "@/utils/constants"

export const useGetOrganisatorServers = () => {
  const isFocused = useIsFocused()

  const {
    data,
    loading: loadingServers,
    fetchMore,
    refetch,
  } = useQuery(GET_ORGANISATOR_MY_SERVERS, {
    skip: !isFocused,
    client,
    variables: {
      filter: {
        pageInput: {
          limit: SERVER_FETCH_LIMIT,
          start: 0,
        },
      },
    },
  })

  const serversResponse = data?.users?.user?.organisator?.myServers

  const fetchMoreServers = useCallback(() => {
    if (!serversResponse || loadingServers) return
    const { servers, pageInfo } = serversResponse
    if (!pageInfo?.hasNext) return
    fetchMore({
      variables: {
        filter: {
          pageInput: {
            limit: SERVER_FETCH_LIMIT,
            start: servers.length,
          },
        },
      },
    })
  }, [loadingServers, serversResponse, fetchMore])

  return {
    servers: serversResponse?.servers ?? [],
    loadingServers,
    hasNextPage: !!serversResponse?.pageInfo?.hasNext,
    totalServers: serversResponse?.pageInfo?.total ?? 0,
    refetchServers: refetch,
    fetchMoreServers,
  }
}
