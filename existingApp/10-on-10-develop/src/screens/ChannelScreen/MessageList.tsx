import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { FlashList } from "@shopify/flash-list"
import { useFocusEffect, useNavigation } from "expo-router"
import { memo, useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LayoutChangeEvent, StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"

import { CustomButton, CustomButtonVariants } from "@/components"
import { useKeyboardFakeView } from "@/utils/helpers/hook"

import { ImageModal, List, MessageSheet, SendMessage } from "./components"
import { useChannelMessage } from "./helpers"
import { FlashListSections, FocusedItem } from "./types"

interface IListHeight {
  channelOpen: boolean
  isHost: boolean
  userBanned: boolean
  serverHostId: string | undefined
  userId: string | undefined
}

const MessageListComponent = ({
  userId,
  channelOpen,
  isHost,
  userBanned,
  serverHostId,
}: IListHeight) => {
  const ref = useRef<FlashList<FlashListSections>>(null)
  const { fakeView } = useKeyboardFakeView()
  const { t } = useTranslation()
  const { setOptions } = useNavigation<NativeStackNavigationProp<ParamListBase>>()

  const { channelMessageGroup, loading, hasNextPage, refetch, fetchMoreMessage } =
    useChannelMessage()

  const [listHeight, setListHeight] = useState(0)
  const [imageUrl, setImageUrl] = useState<string>()
  const [focusedItem, setFocusedItem] = useState<FocusedItem>()

  const onListLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setListHeight(nativeEvent.layout.height)
  }

  const moveToFirstItem = useCallback(
    () => ref.current?.scrollToOffset({ offset: 0, animated: false }),
    [],
  )

  const handleRefetch = useCallback(() => {
    refetch().finally(moveToFirstItem)
  }, [moveToFirstItem, refetch])

  useFocusEffect(
    useCallback(() => {
      setOptions({
        headerRight: () => (
          <CustomButton
            variant={CustomButtonVariants.STAND_ALONE}
            buttonTitle={t("Channel.Refresh")}
            loading={loading}
            onPress={handleRefetch}
          />
        ),
      })
    }, [t, loading, handleRefetch, setOptions]),
  )

  return (
    <>
      <View style={styles.listWrapper} onLayout={onListLayout}>
        <List
          ref={ref}
          channelMessageGroup={channelMessageGroup}
          listHeight={listHeight}
          userId={userId}
          serverHostId={serverHostId}
          loading={loading}
          isHost={isHost}
          channelOpen={channelOpen}
          hasNextPage={!!hasNextPage}
          setFocusedItem={setFocusedItem}
          setImageUrl={setImageUrl}
          fetchMore={fetchMoreMessage}
          refetch={refetch}
          moveToFirstItem={moveToFirstItem}
        />
      </View>
      {channelOpen || (!channelOpen && isHost) ? (
        <>
          <SendMessage userBanned={userBanned} handleRefreshNewestMessage={handleRefetch} />
          <Animated.View style={fakeView} />
        </>
      ) : null}
      <MessageSheet focusedItem={focusedItem} setFocusedItem={setFocusedItem} />
      <ImageModal imageUrl={imageUrl} setImageUrl={setImageUrl} />
    </>
  )
}

export const MessageList = memo(MessageListComponent)

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
  },
})
