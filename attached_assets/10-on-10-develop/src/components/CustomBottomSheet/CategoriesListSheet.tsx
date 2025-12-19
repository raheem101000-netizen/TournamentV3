import { BottomSheetFlashList } from "@gorhom/bottom-sheet"
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { ContentStyle, ListRenderItem } from "@shopify/flash-list"
import { Image } from "expo-image"
import { RefObject, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, View } from "react-native"
import { AnimatedStyle } from "react-native-reanimated"

import { AllCategoriesProps } from "@/gql"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { CustomIndicator, FullScreenIndicator } from "../CustomIndicator"
import { IconPicker } from "../IconPicker"
import { CustomBottomSheet } from "./CustomBottomSheet"
import { CategoryState } from "./interfaces"

interface ICustomBottomSheet extends CategoryState {
  sheetRef: RefObject<BottomSheetModalMethods>
  data: Partial<AllCategoriesProps>[]
  loadingCategories: boolean
  hasNextPage: boolean
  fetchMoreCategories: () => void
}

export const CategoriesListSheet = ({
  data,
  loadingCategories,
  hasNextPage,
  sheetRef,
  selectedCategorySlug,
  fetchMoreCategories,
  onCategoryPress,
}: ICustomBottomSheet) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const contentContainerStyle: StyleProp<AnimatedStyle<ContentStyle>> = {
    paddingHorizontal: 20,
    backgroundColor: colors.background.base.default,
  }

  const pressableStyle: PressableProps["style"] = ({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]

  const handleClosePress = useCallback(() => {
    sheetRef.current?.close()
  }, [sheetRef])

  const renderItem: ListRenderItem<(typeof data)[0]> = ({ item }) => {
    const handleCategoryPress = () => onCategoryPress({ name: item.name, slug: item.slug })
    const fontStyle =
      selectedCategorySlug === item.slug ? defaultFontStyle.TEST : defaultFontStyle.SUBHEADING
    const textColor =
      selectedCategorySlug === item.slug ? colors.text.base.default : colors.text.base.tertiary
    return (
      <Pressable style={pressableStyle} onPress={handleCategoryPress}>
        <View style={styles.container}>
          <View style={{ height: 48, width: 48, borderRadius: 8, overflow: "hidden" }}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={{ flex: 1 }} />
            ) : (
              <View
                style={[
                  {
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.background.accent.secondary,
                  },
                ]}>
                <IconPicker
                  icon="GamepadIcon"
                  width={32}
                  height={32}
                  iconColor={colors.icon.accent.default}
                />
              </View>
            )}
          </View>
          <Text
            style={[
              fontStyle,
              {
                flex: 1,
                color: textColor,
              },
            ]}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    )
  }
  const ItemSeparatorComponent = () => <View style={{ height: 16 }} />

  const ListFooterComponent = () =>
    hasNextPage ? (
      <View style={styles.footerContainer}>
        <CustomIndicator />
      </View>
    ) : null

  return (
    <CustomBottomSheet
      buttonTitle={t("HomeScreen.BottomSheet.button")}
      onPress={handleClosePress}
      sheetRef={sheetRef}
      title={t("HomeScreen.BottomSheet.title")}>
      <BottomSheetFlashList
        extraData={selectedCategorySlug}
        showsVerticalScrollIndicator={false}
        data={data}
        keyExtractor={({ slug, name }, idx) => `${slug}-${name}-${idx}`}
        renderItem={renderItem}
        estimatedItemSize={48}
        contentContainerStyle={contentContainerStyle}
        ItemSeparatorComponent={ItemSeparatorComponent}
        onEndReached={fetchMoreCategories}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooterComponent}
      />
      {loadingCategories ? (
        <View style={[StyleSheet.absoluteFill]}>
          <FullScreenIndicator />
        </View>
      ) : null}
    </CustomBottomSheet>
  )
}

const styles = StyleSheet.create({
  container: { width: "100%", flexDirection: "row", gap: 12, alignItems: "center" },
  footerContainer: { justifyContent: "center", alignItems: "center" },
})
