/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from "react-native"

import { Colors } from "@/utils/constants/Colors"

export const useThemeColor = () => {
  const colorScheme = useColorScheme()
  const theme =
    colorScheme === "dark"
      ? { dark: true, colors: Colors.dark }
      : { dark: false, colors: Colors.light }
  return { colors: theme.colors, dark: theme.dark }
}
