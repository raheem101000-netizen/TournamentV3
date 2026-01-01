import { FlashList, FlashListProps, ListRenderItem } from "@shopify/flash-list"
import { t } from "i18next"
import { Dispatch, forwardRef, SetStateAction, useCallback, useState } from "react"
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { EmptyScreen, IconPicker } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { FlashListSections, FocusedItem, MessageDetailForUser } from "../../types"
import { MessageGroupDate } from "./MessageGroupDate"
import { MessageListItem } from "./MessageListItem"

type ListProps = {
  listHeight: number
  userId: string | undefined
  channelMessageGroup?: FlashListSections[]
  serverHostId: string | undefined
  loading: boolean
  isHost: boolean
  channelOpen: boolean
  hasNextPage: boolean
  setFocusedItem: Dispatch<SetStateAction<FocusedItem | undefined>>
  moveToFirstItem: () => void
  refetch: () => void
  fetchMore: () => void
  setImageUrl: (imageUrl?: string) => void
}

const checkFlashListData = (data: string | object): data is MessageDetailForUser =>
  typeof data !== "string" && "_id" in data

export const List = forwardRef<FlashList<FlashListSections>, ListProps>(
  (
    {
      listHeight,
      userId,
      channelMessageGroup,
      serverHostId,
      loading,
      isHost,
      channelOpen,
      hasNextPage,
      moveToFirstItem,
      setFocusedItem,
      refetch,
      fetchMore,
      setImageUrl,
    },
    ref,
  ) => {
    const { bottom } = useSafeAreaInsets()
    const { colors } = useThemeColor()

    const [showArrow, setShowArrow] = useState(false)

    const ItemSeparatorComponent = () => <View style={styles.separator} />

    const renderItem: ListRenderItem<FlashListSections> = ({ item }) => {
      if (checkFlashListData(item)) {
        return (
          <MessageListItem
            item={item}
            userId={userId}
            serverHostId={serverHostId}
            setFocusedItem={setFocusedItem}
            setImageUrl={setImageUrl}
          />
        )
      }
      return <MessageGroupDate date={item} />
    }

    const ListEmptyComponent = useCallback(() => {
      if (loading) return null
      return (
        <View
          style={[
            styles.listEmptyWrapper,
            {
              height: listHeight,
              transform: [Platform.OS === "ios" ? { rotateX: "180deg" } : { rotate: "180deg" }],
            },
          ]}>
          <EmptyScreen
            title={t(`Channel.${channelOpen || isHost ? "EmptyScreen" : "CloseEmptyScreen"}.Title`)}
            description={t(
              `Channel.${channelOpen || isHost ? "EmptyScreen" : "CloseEmptyScreen"}.Description`,
            )}
          />
        </View>
      )
    }, [channelOpen, isHost, listHeight, loading])

    const onEndReached = () => {
      if (!hasNextPage) return
      fetchMore()
    }

    const keyExtractor = useCallback((item: FlashListSections, index: number) => {
      if (checkFlashListData(item)) {
        return `${item._id}-${item.createdAt}-${index}`
      }
      return `${item}-${index}`
    }, [])

    const onViewableItemsChanged: FlashListProps<FlashListSections>["onViewableItemsChanged"] = ({
      viewableItems,
    }) => setShowArrow(viewableItems[0]?.index !== 0)

    return (
      <>
        <FlashList
          ref={ref}
          data={channelMessageGroup}
          extraData={[userId, serverHostId]}
          contentContainerStyle={{
            paddingTop: 16 + (!channelOpen && !isHost ? bottom : 0),
            ...styles.contentContainerStyle,
          }}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          getItemType={item => (typeof item === "string" ? "sectionHeader" : "row")}
          estimatedItemSize={140}
          onEndReachedThreshold={0.3}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          onViewableItemsChanged={onViewableItemsChanged}
          inverted
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.icon.base.default}
              colors={[colors.icon.base.default]}
              progressBackgroundColor={colors.background.base.default}
            />
          }
          ItemSeparatorComponent={ItemSeparatorComponent}
          renderItem={renderItem}
          onEndReached={onEndReached}
        />
        {showArrow ? (
          <View
            style={[
              styles.absoluteMostRecentContainer,
              { paddingBottom: 8 + (!channelOpen && !isHost ? bottom : 0) },
            ]}>
            <Pressable
              style={[styles.mostRecentContainer, { backgroundColor: colors.icon.accent.default }]}
              onPress={moveToFirstItem}>
              <IconPicker
                icon="ArrowLeft"
                height={18}
                width={18}
                iconColor={colors.icon.base.default}
                style={{ transform: [{ rotate: "270deg" }] }}
              />
              <Text style={[defaultFontStyle.BODY_SMALL, { color: colors.text.base.default }]}>
                {t("Channel.MostRecent")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </>
    )
  },
)
List.displayName = "MessageFlashList"

const styles = StyleSheet.create({
  contentContainerStyle: { paddingBottom: 16, paddingHorizontal: 16 },
  footerComponentWrapper: {
    marginTop: 16,
  },
  separator: {
    paddingVertical: 4,
  },
  listEmptyWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  listWrapper: {
    flex: 1,
  },
  absoluteMostRecentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  mostRecentContainer: {
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
})
