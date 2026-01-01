import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAuth } from "@/providers/AuthProvider"
import {
  DEFAULT_PADDING_BOTTOM,
  DEFAULT_PADDING_HORIZONTAL,
  DEFAULT_PADDING_TOP,
} from "@/utils/constants"
import { NAVIGATION_TABS_TITLE } from "@/utils/constants/Tabs"
import { useThemeColor } from "@/utils/hooks"

import { AccountTabHeader } from "./AccountTabHeader"
import { DefaultHeader } from "./DefaultHeader"

const BORDER_RADIUS = 16

export const MainNavigationHeader = (props: BottomTabHeaderProps) => {
  const { top } = useSafeAreaInsets()
  const { colors } = useThemeColor()
  const { isLogged } = useAuth()

  const headerInitStyle: StyleProp<ViewStyle> = {
    backgroundColor:
      props.options.title === NAVIGATION_TABS_TITLE.Account && isLogged
        ? colors.background.accent.secondary
        : colors.background.base.default,
    paddingTop: top + DEFAULT_PADDING_TOP,
  }

  const mainBackground: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.base.default,
  }

  return (
    <View style={mainBackground}>
      <View style={[headerInitStyle, styles.container]}>
        {typeof props.options.headerTitle === "string" ? (
          <DefaultHeader {...props} />
        ) : (
          <AccountTabHeader />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    paddingBottom: DEFAULT_PADDING_BOTTOM,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    borderEndEndRadius: BORDER_RADIUS,
    borderEndStartRadius: BORDER_RADIUS,
  },
  fallbackWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
})
