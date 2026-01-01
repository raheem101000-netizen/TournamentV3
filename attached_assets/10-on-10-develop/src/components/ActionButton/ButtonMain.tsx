import { Pressable, StyleSheet, ViewStyle } from "react-native"

import { useThemeColor } from "@/utils/hooks"

import { FullScreenIndicator } from "../CustomIndicator"
import { IconPicker } from "../IconPicker"
import { IButtonMain } from "./interfaces"

export const ButtonMain = ({
  buttonHeight,
  buttonWidth,
  icon,
  iconHeight,
  iconWidth,
  loading,
  disabled,
  onPress,
}: IButtonMain) => {
  const { colors } = useThemeColor()

  const BUTTON_WIDTH = buttonWidth ?? 60
  const BUTTON_HEIGHT = buttonHeight ?? 60

  const ICON_WIDTH = iconWidth ?? 36
  const ICON_HEIGHT = iconHeight ?? 36

  const pressableStyle: ViewStyle = {
    height: BUTTON_HEIGHT,
    width: BUTTON_WIDTH,
    backgroundColor:
      loading || disabled ? colors.background.accent.secondary : colors.background.accent.default,
  }

  return (
    <Pressable
      disabled={loading || disabled}
      onPress={onPress}
      style={[staticStyles.pressableStaticStyle, pressableStyle]}>
      {loading ? (
        <FullScreenIndicator indicatorSize={"small"} />
      ) : (
        <IconPicker icon={icon} width={ICON_WIDTH} height={ICON_HEIGHT} />
      )}
    </Pressable>
  )
}

const staticStyles = StyleSheet.create({
  pressableStaticStyle: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
})
