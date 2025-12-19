import { useQuery } from "@apollo/client"
import {
  RouteParams,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CustomButton, FullScreenIndicator, GuestEmptyScreen, IconPicker } from "@/components"
import { GET_SERVER_BY_ID } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useAuth } from "@/providers/AuthProvider"
import {
  DEFAULT_PADDING_BOTTOM,
  DEFAULT_PADDING_HORIZONTAL,
  DEFAULT_PADDING_TOP,
} from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import {
  ChannelsSections,
  EmptyScreenRefetch,
  ServerHeaderButtons,
  ServerInfoHeader,
} from "./components"
import { DeleteServerModal } from "./DeleteServerModal"

interface IServerInfoBody {
  userId: string | undefined
}

export const ServerInfoBody = ({ userId }: IServerInfoBody) => {
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const { colors } = useThemeColor()
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()
  const { push } = useRouter()
  const { setOptions } = useNavigation()
  const { isLogged } = useAuth()

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const initButtonWrapperStyle: StyleProp<ViewStyle> = {
    paddingTop: DEFAULT_PADDING_TOP,
    paddingBottom: bottom + DEFAULT_PADDING_BOTTOM,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    backgroundColor: colors.background.accent.secondary,
  }

  const { data, loading, refetch } = useQuery(GET_SERVER_BY_ID, {
    client,
    variables: {
      serverId: serverInfo,
    },
    fetchPolicy: "cache-first",
  })

  const serverHost = data?.users?.publicUsers?.guest?.serverById?.host._id === userId

  const userBanned = data?.users?.publicUsers?.guest?.serverById?.interestedUsers?.find(
    user => user._id === userId,
  )?.banned

  const serverData = data?.users?.publicUsers?.guest?.serverById

  const iAmInterested = serverData?.iAmInterested

  const refetchServer = () => {
    refetch({
      serverId: serverInfo,
    })
  }

  const onEditPress = () => {
    push({
      pathname: "/main/[serverInfo]/CreateEditServer",
      params: { serverInfo },
    })
  }

  const onDeletePress = () => {
    return setDeleteModalVisible(true)
  }

  useFocusEffect(() => {
    setOptions({
      headerRight:
        !loading && isLogged
          ? () => {
              if (serverHost) {
                return (
                  <Pressable hitSlop={4} onPress={onDeletePress} disabled={loading}>
                    <IconPicker
                      icon={"Trash"}
                      iconColor={colors.icon.danger.default}
                      strokeWidth={2}
                    />
                  </Pressable>
                )
              }
              return (
                <ServerHeaderButtons
                  serverInfo={serverInfo}
                  iAmInterested={!!iAmInterested}
                  loading={loading}
                />
              )
            }
          : null,
    })
  })

  return (
    <View style={styles.container}>
      {!loading ? (
        <>
          {serverData ? (
            <View style={styles.upperBodyContainer}>
              <ServerInfoHeader serverData={serverData} />
              {isLogged ? (
                <ChannelsSections serverHost={serverHost} userBanned={userBanned} />
              ) : (
                <View style={styles.guestWrapper}>
                  <GuestEmptyScreen />
                </View>
              )}
            </View>
          ) : (
            <EmptyScreenRefetch refetch={refetchServer} />
          )}
          {serverHost ? (
            <View style={initButtonWrapperStyle}>
              <CustomButton
                buttonTitle={t("ServerInfo.ChannelsSection.Edit")}
                onPress={onEditPress}
              />
            </View>
          ) : null}
        </>
      ) : (
        <FullScreenIndicator />
      )}
      <DeleteServerModal
        serverName={serverData?.title}
        deleteModalVisible={deleteModalVisible}
        serverInfo={serverInfo}
        setDeleteModalVisible={setDeleteModalVisible}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  upperBodyContainer: {
    flex: 1,
  },
  guestWrapper: {
    flex: 1,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
})
