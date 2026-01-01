import { TypePolicy } from "@apollo/client"

import { ServersByCategoryProps } from "@/gql"

type ServersByCategoryVariables = {
  categorySlug?: string
  filter: { pageInput: { limit: number; start: number }; search?: string }
}

type ServersByCategory = {
  servers: ServersByCategoryProps[]
  pageInfo?: {
    hasNext: boolean
    total: number
  }
}

type ServersByCategoryByStart = Record<string, ServersByCategory>
type ServersByCategoryBySearch = Record<string, ServersByCategoryByStart>

type ServersByCategoryCache = Record<string, ServersByCategoryBySearch>

export const serversByCategory: NonNullable<TypePolicy["fields"]>[0] = {
  read(existing: ServersByCategoryCache, { variables }): ServersByCategory {
    if (!existing) return { servers: [] }
    const {
      filter: { search: _search },
      categorySlug: _categorySlug,
    } = variables as ServersByCategoryVariables
    const categorySlug = _categorySlug ?? "all"
    const search = _search ?? ""
    if (!existing[categorySlug]?.[search]) return { servers: [] }
    const categoryData = existing[categorySlug]?.[search]
    if (!categoryData) return { servers: [] }

    const servers = []
    let pageInfo

    for (const key in categoryData) {
      const response = categoryData[key]
      if (response.servers) servers.push(...response.servers)
      pageInfo = response.pageInfo
    }

    return { servers, pageInfo }
  },
  merge(
    existing: ServersByCategoryCache,
    incoming: ServersByCategory,
    { variables },
  ): ServersByCategoryCache {
    const {
      filter: {
        search: _search,
        pageInput: { start },
      },
      categorySlug: _categorySlug,
    } = variables as ServersByCategoryVariables
    const categorySlug = _categorySlug ?? "all"
    const search = _search ?? ""

    if (!existing?.[categorySlug]?.[search]?.[start.toString()]) {
      return {
        ...existing,
        [categorySlug]: {
          ...existing?.[categorySlug],
          ...{
            [search]: {
              ...existing?.[categorySlug]?.[search],
              [start]: {
                servers: incoming?.servers ?? [],
                pageInfo: incoming?.pageInfo,
              },
            },
          },
        },
      }
    }

    return existing
  },
}
