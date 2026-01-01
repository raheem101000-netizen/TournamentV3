import { TypePolicies } from "@apollo/client"

import { ServersByCategoryProps } from "@/gql"

type MyServers = {
  servers: ServersByCategoryProps[]
  pageInfo?: {
    hasNext: boolean
    total: number
  }
}

type MyServersCache = Record<string, MyServers>

type VariableProps = {
  filter: { pageInput: { limit: number; start: number } }
}

export const OrganisatorQuery: TypePolicies = {
  OrganisatorQuery: {
    fields: {
      myServers: {
        read(existing: MyServersCache): MyServers {
          if (!existing) return { servers: [] }
          const servers = []
          let pageInfo

          for (const key in existing) {
            const response = existing[key]
            if (response.servers) servers.push(...response.servers)
            pageInfo = response.pageInfo
          }

          return { servers, pageInfo }
        },
        merge(existing: MyServersCache, incoming: MyServers, { variables }): MyServersCache {
          const {
            filter: {
              pageInput: { start },
            },
          } = variables as VariableProps

          if (!existing?.[start]) {
            return {
              ...existing,
              [start]: {
                servers: incoming.servers,
                pageInfo: incoming.pageInfo,
              },
            }
          }
          return existing
        },
      },
    },
  },
}
