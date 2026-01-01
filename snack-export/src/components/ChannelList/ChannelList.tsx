import { useQuery } from "@apollo/client"
import { BottomSheetModal } from "@gorhom/bottom-sheet"
import { FlashList, ListRenderItem } from "@shopify/flash-list"
import { RouteParams, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { RefreshControl, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { ChannelProps, GET_CHANNELS_BY_SERVER_ID } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { DEFAULT_PADDING_HORIZONTAL, defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { ChannelSheet, ChannelSheetType } from "../CustomBottomSheet"
import { CustomButton, CustomButtonVariants } from "../CustomButton"
import { Divider } from "../Divider"
import { EmptyScreen } from "../EmptyScreens/EmptyScreen"
import { ChannelItem } from "./ChannelItem"

interface IChannelList {
  serverHost: boolean
  listHeight: number
  userBanned?: boolean
  type?: ChannelSheetType
}

export const ChannelList = ({
  listHeight,
  serverHost,
  userBanned,
  type = ChannelSheetType.CREATE,
}: IChannelList) => {
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()
  const createSheetRef = useRef<BottomSheetModal>(null)
  const editSheetRef = useRef<BottomSheetModal>(null)
  const { navigate } = useRouter()
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const { data, loading, refetch } = useQuery(GET_CHANNELS_BY_SERVER_ID, {
    client,
    variables: {
      serverId: serverInfo,
    },
    refetchWritePolicy: "merge",
  })

  const serverById = data?.users?.publicUsers?.guest?.serverById

  const [channelData, setChannelData] = useState<ChannelProps>()

  const initHeaderTitle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }

  const sortedChannels = useMemo(() => {
    return [...(serverById?.channels ?? [])].sort(
      (a, b) => Number(!!b.tournament) - Number(!!a.tournament),
    )
  }, [serverById?.channels])

  const onAddChannelPress = useCallback(() => {
    createSheetRef.current?.present()
  }, [])

  const StickyHeaderComponent = () => {
    if (loading || (serverById?.channels ?? []).length === 0) return null
    return (
      <View style={styles.headerContainer}>
        <Text style={[defaultFontStyle.BODY_STRONG, initHeaderTitle]}>
          {t("ServerInfo.ChannelsSection.Channels")}
        </Text>
        {serverHost ? (
          <CustomButton
            variant={CustomButtonVariants.STAND_ALONE}
            buttonTitle={t("ServerInfo.ChannelsSection.AddChannel")}
            rightIcon="Plus"
            onPress={onAddChannelPress}
          />
        ) : null}
      </View>
    )
  }

  const ListEmptyComponent = () => {
    if (loading || listHeight === 0) return null
    return (
      <View style={[styles.emptyScreenWrapper, { height: listHeight }]}>
        <EmptyScreen
          title={t("ServerInfo.EmptyScreen.NoChannels.Title")}
          description={t(
            `ServerInfo.EmptyScreen.NoChannels.${
              serverHost ? "DescriptionHost" : "DescriptionUser"
            }`,
          )}>
          {serverHost ? (
            <CustomButton
              buttonTitle={t("ServerInfo.EmptyScreen.NoChannels.Button")}
              variant={CustomButtonVariants.SECONDARY}
              onPress={onAddChannelPress}
            />
          ) : null}
        </EmptyScreen>
      </View>
    )
  }

  const renderItem: ListRenderItem<ChannelProps> = ({ item }) => {
    return <ChannelItem item={item} type={type} onItemPress={setChannelData} />
  }

  const resetChannelData = () => setChannelData(undefined)

  useEffect(() => {
    if (channelData) {
      if (type === ChannelSheetType.EDIT) {
        return editSheetRef.current?.present()
      }
      navigate({
        pathname: "/main/[serverInfo]/[channel]",
        params: {
          channel: channelData._id,
          isHost: JSON.stringify(serverHost),
          userBanned: JSON.stringify(!!userBanned),
          serverInfo,
        },
      })
    }
  }, [channelData, serverHost, serverInfo, type, userBanned, navigate])

  useFocusEffect(
    useCallback(() => {
      setChannelData(undefined)
    }, []),
  )

  return (
    <>
      <FlashList
        data={sortedChannels}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        extraData={type}
        estimatedItemSize={56}
        keyExtractor={({ _id, name }) => `${_id}-${name}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.icon.base.default}
          />
        }
        ListHeaderComponent={StickyHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
      />
      <ChannelSheet sheetRef={createSheetRef} type={ChannelSheetType.CREATE} />
      {channelData ? (
        <ChannelSheet
          sheetRef={editSheetRef}
          type={ChannelSheetType.EDIT}
          channelData={channelData}
          resetChannelData={resetChannelData}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  contentContainerStyle: {
    paddingVertical: DEFAULT_PADDING_HORIZONTAL,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
  emptyScreenWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
})
