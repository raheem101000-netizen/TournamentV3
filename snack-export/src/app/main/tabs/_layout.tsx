import { Tabs } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { MainNavigationHeader, TabBarLabel } from "@/components"
import { TabBarIcon } from "@/components/Tabs/TabBarIcon"
import { useAuth } from "@/providers/AuthProvider"
import { NAVIGATION_TABS_TITLE } from "@/utils/constants/Tabs"
import { useThemeColor } from "@/utils/hooks"

const ADDITIONAL_SPACE = 12
const TAB_ELEMENT_HEIGHT = 48

const TabsLayout = () => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()
  const { bottom } = useSafeAreaInsets()
  const { isLogged } = useAuth()

  const initTabBarStyle: StyleProp<ViewStyle> = {
    height: bottom + (TAB_ELEMENT_HEIGHT + ADDITIONAL_SPACE),
    backgroundColor: colors.background.accent.tertiary,
    borderBlockColor: colors.border.base.tertiary,
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        return {
          title: t(`Common.Tabs.${route.name as NAVIGATION_TABS_TITLE}`),
          tabBarItemStyle: styles.tabBarItemStyle,
          tabBarStyle: initTabBarStyle,
          header: props => <MainNavigationHeader {...props} />,
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} routeName={route.name} />,
          tabBarLabel: ({ children, focused }) => <TabBarLabel focused={focused} text={children} />,
        }
      }}>
      <Tabs.Screen
        name={NAVIGATION_TABS_TITLE.Home}
        options={{
          headerTitle: t("Common.TabsHeader.Home"),
        }}
      />
      <Tabs.Screen
        name={NAVIGATION_TABS_TITLE.Discovery}
        options={{
          headerTitle: "Discover",
          title: "Discover"
        }}
      />
      <Tabs.Screen
        name={NAVIGATION_TABS_TITLE.Messages}
        options={{
          headerTitle: "Messages",
          title: "Messages"
        }}
      />
      <Tabs.Screen
        name={NAVIGATION_TABS_TITLE.Notifications}
        options={{
          headerTitle: "Notifications",
          title: "Alerts"
        }}
      />
      <Tabs.Screen
        name={NAVIGATION_TABS_TITLE.MyServers}
        options={{
          headerTitle: t("Common.TabsHeader.MyServers"),
        }}
      />
      <Tabs.Screen
        name={NAVIGATION_TABS_TITLE.Account}
        options={{
          headerTitle: !isLogged ? t("Common.TabsHeader.Account") : undefined,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarItemStyle: {
    height: TAB_ELEMENT_HEIGHT,
    marginTop: ADDITIONAL_SPACE,
    paddingBottom: 4,
    gap: 4,
  },
})

export default TabsLayout
