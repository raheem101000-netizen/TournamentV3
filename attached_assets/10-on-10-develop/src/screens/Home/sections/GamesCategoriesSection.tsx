import { BottomSheetModal } from "@gorhom/bottom-sheet"
import { FlashList, FlashListProps, ListRenderItem } from "@shopify/flash-list"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, useWindowDimensions, View } from "react-native"

import { CategoriesListSheet, CategoryState, CustomButton, CustomIndicator } from "@/components"
import { FullScreenIndicator } from "@/components/CustomIndicator/"
import { AllCategoriesProps } from "@/gql"
import { DEFAULT_PADDING_HORIZONTAL } from "@/utils/constants"

import { GameCategoryButton, GamesCategoriesBar } from "../components"
import { IMAGE_SIZE, SEPARATOR_SIZE } from "../constants"

interface IGamesCategoriesSection extends CategoryState {
  data: Partial<AllCategoriesProps>[]
  loadingCategories: boolean
  hasNextPage: boolean
  fetchMoreCategories: () => void
  refetch: () => void
}
export const GamesCategoriesSection = ({
  data,
  selectedCategorySlug,
  loadingCategories,
  hasNextPage,
  fetchMoreCategories,
  onCategoryPress,
  refetch,
}: IGamesCategoriesSection) => {
  const categoriesListRef = useRef<FlashList<Partial<AllCategoriesProps>>>(null)
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const categoriesListSheetRef = useRef<BottomSheetModal>(null)

  const [prevSelectedItem, setPrevSelectedItem] = useState<string>()

  const renderItem: ListRenderItem<(typeof data)[0]> = ({ item }) =>
    item.name ? (
      <GameCategoryButton
        item={item}
        selectedCategorySlug={selectedCategorySlug}
        onCategoryPress={onCategoryPress}
      />
    ) : null

  const ItemSeparatorComponent = () => <View style={styles.separator} />

  const ListFooterComponent = useCallback(
    () =>
      hasNextPage ? (
        <View style={styles.footerComponentWrapper}>
          <CustomIndicator />
        </View>
      ) : null,
    [hasNextPage],
  )

  const onFullListPress = useCallback(() => {
    categoriesListSheetRef.current?.present()
  }, [categoriesListSheetRef])

  const onEndReached = useCallback(() => {
    if (loadingCategories) return
    fetchMoreCategories()
  }, [fetchMoreCategories, loadingCategories])

  const keyExtractor = useCallback<
    NonNullable<FlashListProps<Partial<AllCategoriesProps>>["keyExtractor"]>
  >(({ slug, name }, idx) => `${slug}-${name}-${idx}`, [])

  const handleRefetch = useCallback(() => refetch(), [refetch])

  useEffect(() => {
    prevSelectedItem !== selectedCategorySlug &&
      categoriesListRef.current?.scrollToItem({
        item: data.find(item => item.slug === selectedCategorySlug),
        animated: true,
        viewOffset: width / 2 - IMAGE_SIZE / 2,
      })
    return () => setPrevSelectedItem(selectedCategorySlug)
  }, [data, loadingCategories, hasNextPage, prevSelectedItem, selectedCategorySlug, width])

  return (
    <View style={styles.gamesCategoriesSection}>
      <GamesCategoriesBar data={data} loading={loadingCategories} onPress={onFullListPress} />
      <View style={{ height: IMAGE_SIZE + 18, justifyContent: "center" }}>
        {!loadingCategories ? (
          data.length ? (
            <FlashList
              ref={categoriesListRef}
              bounces={false}
              horizontal
              showsHorizontalScrollIndicator={false}
              estimatedItemSize={IMAGE_SIZE}
              onEndReachedThreshold={0.3}
              contentContainerStyle={styles.gamesCategoriesContentContainerStyle}
              data={data}
              extraData={[selectedCategorySlug]}
              keyExtractor={keyExtractor}
              ListFooterComponent={ListFooterComponent}
              onEndReached={onEndReached}
              ItemSeparatorComponent={ItemSeparatorComponent}
              renderItem={renderItem}
            />
          ) : (
            <View style={{ alignSelf: "center", width: "50%" }}>
              <CustomButton buttonTitle={t("Channel.Refresh")} onPress={handleRefetch} />
            </View>
          )
        ) : (
          <FullScreenIndicator />
        )}
      </View>
      <CategoriesListSheet
        data={data}
        loadingCategories={loadingCategories}
        sheetRef={categoriesListSheetRef}
        selectedCategorySlug={selectedCategorySlug}
        hasNextPage={hasNextPage}
        onCategoryPress={onCategoryPress}
        fetchMoreCategories={fetchMoreCategories}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  gamesCategoriesSection: { maxHeight: 300, paddingTop: 16, gap: 16 },
  gamesCategoriesContentContainerStyle: {
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
  separator: {
    width: SEPARATOR_SIZE,
  },
  footerComponentWrapper: {
    flex: 1,
    width: IMAGE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SEPARATOR_SIZE,
  },
})
