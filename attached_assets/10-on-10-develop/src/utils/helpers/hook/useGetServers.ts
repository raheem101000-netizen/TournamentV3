import { useQuery } from "@apollo/client"
import { useIsFocused } from "@react-navigation/native"
import { useCallback } from "react"

import { SERVERS_BY_CATEGORY } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { SERVER_FETCH_LIMIT } from "@/utils/constants"

interface IUseGetSeversByCategoryId {
  selectedCategorySlug: string | undefined
}

export const useGetServers = ({ selectedCategorySlug }: IUseGetSeversByCategoryId) => {
  const isFocused = useIsFocused()
  const { data, loading, fetchMore, refetch } = useQuery(SERVERS_BY_CATEGORY, {
    skip: !isFocused,
    client,
    variables: {
      categorySlug: selectedCategorySlug,
      filter: {
        pageInput: {
          limit: SERVER_FETCH_LIMIT,
          start: 0,
        },
      },
    },
  })

  const allServersData = data?.users?.publicUsers?.guest?.serversByCategory
  const fetchMoreServers = useCallback(() => {
    if (!allServersData || loading) return
    const { servers, pageInfo } = allServersData

    if (!pageInfo?.hasNext) return
    fetchMore({
      variables: {
        filter: {
          categorySlug: selectedCategorySlug,
          pageInput: {
            limit: SERVER_FETCH_LIMIT,
            start: servers.length,
          },
        },
      },
    })
  }, [allServersData, fetchMore, loading, selectedCategorySlug])

  return {
    servers: allServersData?.servers ?? [],
    loading,
    hasNextPage: !!allServersData?.pageInfo?.hasNext,
    refetch,
    fetchMoreServers,
  }
}
