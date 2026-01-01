import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import PagerView from "react-native-pager-view"

import { DEFAULT_PADDING_HORIZONTAL } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { SCREENS } from "../constants"
import { PagerHeaderBadge } from "./PagerHeaderBadge"

interface IPagerHeader {
  pagerRef: { current: PagerView | null }
  selectedScreen: SCREENS
}

export const PagerHeader = ({ selectedScreen, pagerRef }: IPagerHeader) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.secondary,
  }

  return (
    <View style={[styles.container, initContainerStyle]}>
      <PagerHeaderBadge
        title={t("MyServers.Hosted.Title")}
        selected={selectedScreen === SCREENS.HOSTED_SCREEN}
        pagerRef={pagerRef}
        screen={SCREENS.HOSTED_SCREEN}
      />
      <PagerHeaderBadge
        title={t("MyServers.Joined.Title")}
        selected={selectedScreen === SCREENS.JOINED_SCREEN}
        pagerRef={pagerRef}
        screen={SCREENS.JOINED_SCREEN}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

    marginHorizontal: DEFAULT_PADDING_HORIZONTAL,
    padding: 6,
    borderRadius: 6,
    marginBottom: 24,
  },
})
