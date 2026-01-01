import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"

import { useThemeColor } from "@/utils/hooks"

export const Divider = () => {
  const { colors } = useThemeColor()

  const initStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.border.base.tertiary,
  }

  return <View style={[styles.divider, initStyle]} />
}

const styles = StyleSheet.create({
  divider: {
    height: 0.5,
    width: "100%",
  },
})
