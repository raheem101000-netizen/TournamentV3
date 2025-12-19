import { useQuery } from "@apollo/client"
import { RouteParams, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router"
import { StyleSheet, View, Text } from "react-native"

import { FullScreenIndicator, ScreenView } from "@/components"
import { GET_CHANNEL_DETAILS, GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { ListDescription, MessageList } from "@/screens/ChannelScreen"
import { TournamentDashboardScreen } from "@/modules/tournaments"

const Channel = () => {
  const {
    channel,
    isHost,
    userBanned: isBanned,
  } = useLocalSearchParams<RouteParams<"/main/[serverInfo]/[channel]">>()
  const { setOptions } = useNavigation()

  const { data, loading } = useQuery(GET_CHANNEL_DETAILS, {
    client,
    variables: {
      channelId: channel,
    },
  })

  const { data: userData, loading: loadingUser } = useQuery(GET_USER, {
    client,
    fetchPolicy: "cache-first",
  })

  const channelDetails = data?.users?.user?.channelById
  const serverHostId = data?.users?.user?.channelById?.server?.host._id

  useFocusEffect(() => {
    setOptions({
      title: channelDetails?.name,
    })
  })

  const sendMessageAvailable = JSON.parse(isHost as string) as boolean

  const userBanned = JSON.parse(isBanned as string) as boolean
  
  const isTournamentChannel = channelDetails?.tournament === true
  
  const currentUserId = userData?.users?.user?.me?._id
  const isServerOwner = serverHostId === currentUserId

  if (loading || loadingUser) {
    return (
      <ScreenView removeHorizontalPadding removeBottomInset removeTopInset>
        <FullScreenIndicator />
      </ScreenView>
    )
  }

  if (isTournamentChannel) {
    if (!isServerOwner) {
      return (
        <ScreenView removeHorizontalPadding removeBottomInset removeTopInset>
          <View style={styles.permissionDenied}>
            <Text style={styles.permissionTitle}>Access Denied</Text>
            <Text style={styles.permissionText}>
              Only the server owner can access the Tournament Dashboard.
            </Text>
          </View>
        </ScreenView>
      )
    }

    return (
      <ScreenView removeHorizontalPadding removeBottomInset removeTopInset>
        <TournamentDashboardScreen />
      </ScreenView>
    )
  }

  return (
    <ScreenView removeHorizontalPadding removeBottomInset removeTopInset>
      <View style={styles.container}>
        <ListDescription description={channelDetails?.description} open={channelDetails?.open} />
        <MessageList
          userId={userData?.users?.user?.me?._id}
          channelOpen={!!channelDetails?.open}
          isHost={sendMessageAvailable}
          userBanned={userBanned}
          serverHostId={serverHostId}
        />
      </View>
    </ScreenView>
  )
}
export default Channel

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
