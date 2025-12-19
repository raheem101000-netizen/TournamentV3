import { PropsWithChildren } from "react"
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { DEFAULT_PADDING_HORIZONTAL } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ICustomView extends PropsWithChildren {
  removeTopInset?: boolean
  removeBottomInset?: boolean
  removeHorizontalPadding?: boolean
  imageBackground?: unknown
}

export const ScreenView = ({
  removeBottomInset,
  removeTopInset,
  removeHorizontalPadding,
  imageBackground,
  children,
}: ICustomView) => {
  const { colors } = useThemeColor()
  const { top, bottom } = useSafeAreaInsets()

  const conditionalStyles: StyleProp<ViewStyle> = {
    paddingBottom: !removeBottomInset ? bottom : 0,
    paddingTop: !removeTopInset ? top : 0,
    backgroundColor: colors.background.base.default,
    paddingHorizontal: !removeHorizontalPadding ? DEFAULT_PADDING_HORIZONTAL : 0,
  }
  if (imageBackground) {
    return (
      <View style={[styles.container]}>
        <ImageBackground style={[styles.container, conditionalStyles]} source={imageBackground}>
          {children}
        </ImageBackground>
      </View>
    )
  }
  return <View style={[styles.container, conditionalStyles]}>{children}</View>
}
const styles = StyleSheet.create({
  container: { flex: 1 },
})
