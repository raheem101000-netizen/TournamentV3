import { useQuery } from "@apollo/client"

import { FullScreenIndicator, ScreenView } from "@/components"
import { GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useAuth } from "@/providers/AuthProvider"
import { EmptyScreenRefetch, ServerInfoBody } from "@/screens/ServerInfo"

const ServerInfo = () => {
  const { isLogged } = useAuth()

  const {
    data: userData,
    loading: loadingGetUser,
    refetch,
  } = useQuery(GET_USER, {
    skip: !isLogged,
    client,
  })
  const handleRefetch = () => refetch()

  return (
    <ScreenView removeBottomInset removeHorizontalPadding removeTopInset>
      {!isLogged ? (
        <ServerInfoBody userId={undefined} />
      ) : !loadingGetUser ? (
        userData?.users?.user?.me?._id ? (
          <ServerInfoBody userId={userData?.users?.user?.me?._id} />
        ) : (
          <EmptyScreenRefetch refetch={handleRefetch} />
        )
      ) : (
        <FullScreenIndicator />
      )}
    </ScreenView>
  )
}
export default ServerInfo
