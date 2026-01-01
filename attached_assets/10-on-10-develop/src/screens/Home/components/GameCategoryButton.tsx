import { Image } from "expo-image"
import { memo, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"

import { CategoryState, IconPicker } from "@/components"
import { AllCategoriesProps } from "@/gql"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { IMAGE_SIZE, SEPARATOR_SIZE } from "../constants"

interface IGameCategoryButton extends CategoryState {
  item: Partial<AllCategoriesProps>
}

const GameCategoryButtonComponent = ({
  item,
  selectedCategorySlug,
  onCategoryPress,
}: IGameCategoryButton) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const [loadingImage, setLoadingImage] = useState(true)

  const initPresableStyle: StyleProp<ViewStyle> = {
    marginRight: item ? 0 : SEPARATOR_SIZE,
  }

  const allCategoryItem: StyleProp<ViewStyle> = useMemo(() => {
    return {
      backgroundColor: colors.background.accent.secondary,
    }
  }, [colors.background.accent.secondary])

  const initTextStyle: StyleProp<TextStyle> = {
    color:
      selectedCategorySlug === item?.slug ? colors.text.base.default : colors.text.base.tertiary,
  }

  const Icon = useCallback(
    () => (
      <View style={[styles.gameThumbnailStyle, styles.allCategoryWrapper, allCategoryItem]}>
        <IconPicker
          icon="GamepadIcon"
          width={32}
          height={32}
          iconColor={colors.icon.accent.default}
        />
      </View>
    ),
    [allCategoryItem, colors.icon.accent.default],
  )

  const LoadingImage = useCallback(() => {
    if (!loadingImage) return null
    return (
      <View style={StyleSheet.absoluteFill}>
        <Icon />
      </View>
    )
  }, [Icon, loadingImage])

  const onLoadEnd = () => setLoadingImage(false)

  const onPress = () =>
    onCategoryPress({
      name: item.name,
      slug: item.slug,
    })

  return (
    <Pressable style={[styles.gameCategoryButtonStyle, initPresableStyle]} onPress={onPress}>
      <View>
        {item?.image ? (
          <>
            <Image
              source={{ uri: item.image }}
              style={styles.gameThumbnailStyle}
              contentFit="cover"
              cachePolicy="memory-disk"
              onLoadEnd={onLoadEnd}
            />
            <LoadingImage />
          </>
        ) : (
          <Icon />
        )}
      </View>
      <Text
        style={[styles.categoryText, defaultFontStyle.BODY_XS_STRONG, initTextStyle]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {item?.name ?? t("HomeScreen.GamesCategoriesBar.AllCategoriesButtonLabel")}
      </Text>
    </Pressable>
  )
}

export const GameCategoryButton = memo(GameCategoryButtonComponent)

const styles = StyleSheet.create({
  gameCategoryButtonStyle: { alignItems: "center", gap: 4 },
  allCategoryWrapper: { justifyContent: "center", alignItems: "center" },
  gameThumbnailStyle: { height: IMAGE_SIZE, width: IMAGE_SIZE, borderRadius: 8 },
  categoryText: { maxWidth: IMAGE_SIZE },
})
