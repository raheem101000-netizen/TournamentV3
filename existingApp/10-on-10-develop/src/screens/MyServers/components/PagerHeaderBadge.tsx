import React from "react"
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native"
import PagerView from "react-native-pager-view"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { SCREENS } from "../constants"

interface IHeaderBadge {
  title: string
  selected: boolean
  screen: SCREENS
  pagerRef: { current: PagerView | null }
}

export const PagerHeaderBadge = ({ title, selected, screen, pagerRef }: IHeaderBadge) => {
  const { colors } = useThemeColor()

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: selected ? colors.background.base.secondary : "transparent",
  }
  const initTextStyle: StyleProp<TextStyle> = {
    color: selected ? colors.text.accent.default : colors.text.accent.secondary,
  }

  const onPress = () => !selected && pagerRef.current?.setPage(screen)

  return (
    <Pressable style={[styles.container, initContainerStyle]} onPress={onPress}>
      <Text style={[defaultFontStyle.BODY_SMALL_STRONG, initTextStyle]}> {title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    paddingVertical: 6,
  },
})
