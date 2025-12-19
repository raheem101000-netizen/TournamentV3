import { useQuery } from "@apollo/client"
import { FlashList, ListRenderItem } from "@shopify/flash-list"
import { RouteParams, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router"
import { useMemo, useState } from "react"
import { RefreshControl, StyleSheet, View } from "react-native"

import { Divider, ScreenView } from "@/components"
import { GET_SERVER_BY_ID, GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { PlayerItem, PlayerItemProps, PlayerSheet } from "@/screens/PlayersList"
import {
  DEFAULT_PADDING_BOTTOM,
  DEFAULT_PADDING_HORIZONTAL,
  DEFAULT_PADDING_TOP,
} from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

const PlayersList = () => {
  const { colors } = useThemeColor()
  const { setOptions } = useNavigation()
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>()

  const { data: userData, loading: loadingUserData } = useQuery(GET_USER, {
    client,
  })

  const { data, loading, refetch } = useQuery(GET_SERVER_BY_ID, {
    client,
    variables: {
      serverId: serverInfo,
    },
  })

  const serverById = data?.users?.publicUsers?.guest?.serverById

  const serverHost = serverById?.host._id === userData?.users?.user?.me?._id

  const myId = userData?.users?.user?.me?._id

  const ItemSeparatorComponent = () => (
    <View style={styles.dividerWrapper}>
      <Divider />
    </View>
  )

  const renderItem: ListRenderItem<PlayerItemProps> = ({ item }) => {
    return <PlayerItem item={item} myId={myId} onExpandPress={setSelectedPlayerId} />
  }

  useFocusEffect(() => {
    setOptions({ title: serverById?.title })
  })

  const selectedPlayer = useMemo(() => {
    if (!serverById?.interestedUsers) return
    return serverById.interestedUsers.find(user => user._id === selectedPlayerId)
  }, [selectedPlayerId, serverById?.interestedUsers])

  return (
    <>
      <ScreenView removeHorizontalPadding removeBottomInset removeTopInset>
        <FlashList
          data={serverById?.interestedUsers}
          extraData={[serverHost, myId]}
          contentContainerStyle={styles.contentContainerStyle}
          keyExtractor={({ _id, fullName }) => `${_id}-${fullName}`}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparatorComponent}
          estimatedItemSize={30}
          refreshControl={
            <RefreshControl
              refreshing={loading || loadingUserData}
              onRefresh={refetch}
              tintColor={colors.icon.base.default}
            />
          }
        />
      </ScreenView>
      <PlayerSheet
        selectedPlayer={selectedPlayer}
        serverHost={serverHost}
        setSelectedPlayer={setSelectedPlayerId}
      />
    </>
  )
}

export default PlayersList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footerComponentWrapper: {
    marginTop: 16,
  },
  contentContainerStyle: {
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    paddingBottom: DEFAULT_PADDING_BOTTOM,
    paddingTop: DEFAULT_PADDING_TOP * 2,
  },
  dividerWrapper: {
    paddingVertical: 16,
  },
  listEmptyWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
})
