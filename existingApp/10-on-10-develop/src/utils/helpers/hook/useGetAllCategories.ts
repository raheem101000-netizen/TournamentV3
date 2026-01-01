import { useQuery } from "@apollo/client"
import { useCallback } from "react"

import { GET_ALL_CATEGORIES } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { CATEGORIES_FETCH_LIMIT } from "@/utils/constants"

export const useGetAllCategories = () => {
  const {
    data,
    loading: loadingCategories,
    fetchMore,
    refetch,
  } = useQuery(GET_ALL_CATEGORIES, {
    client,
    variables: {
      pageInput: {
        limit: CATEGORIES_FETCH_LIMIT,
        start: 0,
      },
    },
  })

  const categoriesResponse = data?.users?.publicUsers?.guest?.categories

  const fetchMoreCategories = useCallback(() => {
    if (!categoriesResponse || loadingCategories) return
    const { categories, pageInfo } = categoriesResponse
    if (!pageInfo?.hasNext) return
    fetchMore({
      query: GET_ALL_CATEGORIES,
      variables: {
        pageInput: {
          limit: CATEGORIES_FETCH_LIMIT,
          start: categories.length,
        },
      },
    })
  }, [categoriesResponse, loadingCategories, fetchMore])

  return {
    categories: categoriesResponse?.categories ?? [],
    loadingCategories,
    hasNextPage: !!categoriesResponse?.pageInfo?.hasNext,
    fetchMoreCategories,
    refetchCategories: refetch,
  }
}
