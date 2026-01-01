import { TypePolicies } from "@apollo/client"

import { ServersByCategoryProps } from "@/gql"

type FollowedServersProps = {
  servers: ServersByCategoryProps[]
  pageInfo?: {
    hasNext: boolean
    total: boolean
  }
}

type FollowedServersCache = Record<string, FollowedServersProps>

type VariableProps = {
  pageInput: { limit: number; start: number }
}

export const FollowedServers: TypePolicies = {
  User: {
    fields: {
      followedServers: {
        keyArgs: ["UserFollowedServer"],
        read(existing: FollowedServersCache): FollowedServersProps {
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
        merge(
          existing: FollowedServersCache,
          incoming: FollowedServersProps,
          { variables },
        ): FollowedServersCache {
          const {
            pageInput: { start },
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
