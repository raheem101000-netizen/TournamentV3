import { StyleProp, Text, TextStyle } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ITabBarLabel {
  focused: boolean
  text: string
}

export const TabBarLabel = ({ focused, text }: ITabBarLabel) => {
  const { colors } = useThemeColor()

  const font = focused ? defaultFontStyle.BODY_SMALL_STRONG : defaultFontStyle.BODY_SMALL

  const initTextStyle: StyleProp<TextStyle> = {
    color: focused ? colors.icon.accent.default : colors.icon.accent.secondary,
  }

  return <Text style={[font, initTextStyle]}>{text}</Text>
}
