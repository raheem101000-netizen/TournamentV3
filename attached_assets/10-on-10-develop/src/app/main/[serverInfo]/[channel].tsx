import { useQuery } from "@apollo/client"
import { RouteParams, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router"
import { StyleSheet, View } from "react-native"

import { FullScreenIndicator, ScreenView } from "@/components"
import { GET_CHANNEL_DETAILS, GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { ListDescription, MessageList } from "@/screens/ChannelScreen"

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

  return (
    <ScreenView removeHorizontalPadding removeBottomInset removeTopInset>
      {!loading || loadingUser ? (
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
      ) : (
        <FullScreenIndicator />
      )}
    </ScreenView>
  )
}
export default Channel

const styles = StyleSheet.create({
  container: { flex: 1 },
})
