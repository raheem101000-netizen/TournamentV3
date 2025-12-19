import { TypePolicy } from "@apollo/client"

import { AllCategoriesProps } from "@/gql"

type VariablesProps = {
  pageInput: {
    limit: number
    start: number
  }
}

type CategoriesProps = {
  categories: AllCategoriesProps[]
  pageInfo?: {
    hasNext: boolean
    total: boolean
  }
}

type CategoriesCache = Record<string, CategoriesProps>

export const categories: NonNullable<TypePolicy["fields"]>[0] = {
  read(existing: CategoriesCache): CategoriesProps {
    const categories = []
    let pageInfo
    for (const key in existing) {
      const response = existing[key]
      if (response.categories) categories.push(...response.categories)
      pageInfo = response.pageInfo
    }

    return { categories, pageInfo }
  },
  merge(existing: CategoriesCache, incoming: CategoriesProps, { variables }): CategoriesCache {
    const {
      pageInput: { start },
    } = variables as VariablesProps
    if (!existing?.[start.toString()]) {
      return {
        ...existing,
        [start]: {
          categories: incoming.categories,
          pageInfo: incoming?.pageInfo,
        },
      }
    }
    return existing
  },
}
