import { PropsWithChildren } from "react"
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"

import { DEFAULT_PADDING_VERTICAL, defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface IEmptyScreen extends PropsWithChildren {
  title: string
  description: string
  containerStyle?: StyleProp<ViewStyle>
}

export const EmptyScreen = ({ description, title, containerStyle, children }: IEmptyScreen) => {
  const { colors } = useThemeColor()

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.tertiary,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.icon.base.tertiary,
  }

  const initTitleStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }

  const initDescriptionStyle: StyleProp<TextStyle> = { color: colors.text.base.tertiary }

  return (
    <View style={[styles.container, initContainerStyle, containerStyle]}>
      <View style={styles.textContainer}>
        <Text style={[styles.textWrapper, defaultFontStyle.SUBHEADING, initTitleStyle]}>
          {title}
        </Text>
        <Text style={[styles.textWrapper, defaultFontStyle.BODY_BASE, initDescriptionStyle]}>
          {description}
        </Text>
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: DEFAULT_PADDING_VERTICAL,
    paddingHorizontal: 12,
    gap: 20,
    borderRadius: 8,
  },
  textContainer: {
    gap: 4,
  },
  textWrapper: {
    textAlign: "center",
  },
})
