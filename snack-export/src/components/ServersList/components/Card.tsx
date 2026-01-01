import { useRouter } from "expo-router"
import { memo } from "react"
import {
  ImageBackground,
  ImageBackgroundProps,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native"

import { IconPicker } from "@/components/IconPicker"
import { ServersByCategoryProps } from "@/gql"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ICard {
  item: ServersByCategoryProps
}

const CardComponent = ({ item }: ICard) => {
  const { colors } = useThemeColor()
  const { navigate } = useRouter()

  const { category, description, title } = item

  const imageSource: ImageBackgroundProps["source"] = category?.image
    ? {
        uri: category.image,
      }
    : undefined
  const serverCardContainerStyle: StyleProp<ViewStyle> = {
    flex: 1,
    backgroundColor: colors.background.over.secondary,
    padding: 24,
  }

  const onPress = () => {
    navigate({
      pathname: "/main/[serverInfo]/ServerInfo",
      params: {
        serverInfo: item._id,
      },
    })
  }

  return (
    <Pressable
      style={[styles.imageWrapper, { borderColor: colors.border.base.tertiary }]}
      onPress={onPress}>
      <ImageBackground source={imageSource} resizeMode="cover" style={{ flex: 1 }}>
        <View style={serverCardContainerStyle}>
          <Text style={[defaultFontStyle.TEST, { color: colors.text.base.secondary }]}>
            {title}
          </Text>
          <Text
            numberOfLines={3}
            style={[
              defaultFontStyle.SINGLE_LINE_XS_STRONG,
              { color: colors.text.base.tertiary, textAlign: "justify" },
            ]}>
            {description}
          </Text>
          <View style={styles.badgeWithButtonWrapper}>
            <View style={styles.buttonStyle}>
              <IconPicker
                icon="ArrowRight"
                iconColor={colors.text.accent.default}
                strokeWidth={2}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  imageWrapper: {
    overflow: "hidden",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonStyle: {
    width: "100%",
    height: 48,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    borderRadius: 8,
  },
  badgeStyle: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeWithButtonWrapper: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})

export const Card = memo(CardComponent)
