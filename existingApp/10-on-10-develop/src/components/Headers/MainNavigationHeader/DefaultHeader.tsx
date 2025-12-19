import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs"
import { StyleProp, Text, TextStyle } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

export const DefaultHeader = ({ options }: BottomTabHeaderProps) => {
  const { colors } = useThemeColor()

  const initTitleStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }

  return typeof options.headerTitle === "string" ? (
    <Text style={[initTitleStyle, defaultFontStyle.TITLE_PAGE]}>{options.headerTitle}</Text>
  ) : null
}
