import { FlashList, FlashListProps, ListRenderItem } from "@shopify/flash-list"
import { useCallback } from "react"
import { RefreshControl, ScrollViewProps, StyleSheet, View } from "react-native"

import { ServersByCategoryProps } from "@/gql"
import { DEFAULT_PADDING_HORIZONTAL, DEFAULT_PADDING_VERTICAL } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { CustomIndicator } from "../CustomIndicator"
import { Card } from "./components"

interface ICategoriesList {
  data: ServersByCategoryProps[]
  loading: boolean
  hasNextPage: boolean
  listHeight: number
  EmptyScreenComponent: JSX.Element
  onScroll?: ScrollViewProps["onScroll"]
  refetch: () => void
  fetchMore: () => void
  setListTapped?: (value: boolean) => void
}

export const ServersList = ({
  data,
  loading,
  hasNextPage,
  listHeight,
  EmptyScreenComponent,
  onScroll,
  refetch,
  fetchMore,
  setListTapped,
}: ICategoriesList) => {
  const { colors } = useThemeColor()

  const renderItem: ListRenderItem<ServersByCategoryProps> = ({ item }) => {
    return <Card item={item} />
  }

  const ListFooterComponent = useCallback(
    () =>
      hasNextPage && !loading ? (
        <View style={styles.footerComponentWrapper}>
          <CustomIndicator />
        </View>
      ) : null,
    [hasNextPage, loading],
  )

  const ItemSeparatorComponent = () => <View style={styles.separator} />

  const ListEmptyComponent = useCallback(() => {
    if (loading) return
    return (
      <View style={[styles.listEmptyWrapper, { height: listHeight }]}>{EmptyScreenComponent}</View>
    )
  }, [EmptyScreenComponent, listHeight, loading])

  const onScrollEndDrag = useCallback(() => {
    setListTapped?.(false)
  }, [setListTapped])

  const onTouchStart = useCallback(() => {
    setListTapped?.(true)
  }, [setListTapped])

  const keyExtractor = useCallback<
    NonNullable<FlashListProps<ServersByCategoryProps>["keyExtractor"]>
  >(({ _id, title }) => `${_id}-${title}`, [])

  const onEndReach = useCallback(() => {
    if (loading) return
    fetchMore()
  }, [fetchMore, loading])

  return (
    <FlashList
      data={data}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.7}
      contentContainerStyle={styles.contentContainerStyle}
      estimatedItemSize={188}
      refreshing={loading}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          tintColor={colors.icon.base.default}
        />
      }
      keyExtractor={keyExtractor}
      onScroll={onScroll}
      ItemSeparatorComponent={ItemSeparatorComponent}
      renderItem={renderItem}
      onEndReached={onEndReach}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      onTouchStart={onTouchStart}
      onScrollEndDrag={onScrollEndDrag}
    />
  )
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    paddingVertical: DEFAULT_PADDING_VERTICAL,
  },
  footerComponentWrapper: {
    marginTop: 16,
  },
  listEmptyWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    height: 8,
  },
})
