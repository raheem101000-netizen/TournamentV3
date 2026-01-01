import { ActivityIndicator } from "react-native"

import { useThemeColor } from "@/utils/hooks"

import { ICustomIndicator } from "./types"

export const CustomIndicator = ({ indicatorColor, indicatorSize = "large" }: ICustomIndicator) => {
  const { colors } = useThemeColor()

  const color = indicatorColor ?? colors.icon.base.default

  return <ActivityIndicator size={indicatorSize} color={color} />
}
