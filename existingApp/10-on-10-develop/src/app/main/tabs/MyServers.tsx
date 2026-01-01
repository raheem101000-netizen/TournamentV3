import { useQuery } from "@apollo/client"

import { AddNewServerButton, FullScreenIndicator, GuestEmptyScreen, ScreenView } from "@/components"
import { GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useAuth } from "@/providers/AuthProvider"
import { JoinedScreen, OrganiserBody } from "@/screens/MyServers"

const MyServers = () => {
  const { isLogged } = useAuth()

  const { data, loading } = useQuery(GET_USER, {
    skip: !isLogged,
    client,
  })

  if (!isLogged)
    return (
      <ScreenView>
        <GuestEmptyScreen />
      </ScreenView>
    )

  return (
    <ScreenView removeTopInset removeBottomInset removeHorizontalPadding>
      {loading ? (
        <FullScreenIndicator />
      ) : data?.users?.user?.me?.isOrganisator ? (
        <>
          <OrganiserBody />
          <AddNewServerButton isOrganisator={data.users.user.me.isOrganisator} />
        </>
      ) : (
        <JoinedScreen />
      )}
    </ScreenView>
  )
}
export default MyServers
