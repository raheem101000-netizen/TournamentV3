import { StyleProp } from "react-native"
import { SvgProps } from "react-native-svg"

import { NAVIGATION_TABS_TITLE } from "@/utils/constants/Tabs"
import { useCalculateSizeRatio, useThemeColor } from "@/utils/hooks"

import { IconPicker } from "../IconPicker"

interface ITabBarIcon {
  focused: boolean
  routeName: string
}

const ICON_SIZE = 28

export const TabBarIcon = ({ focused, routeName }: ITabBarIcon) => {
  const { colors } = useThemeColor()
  const { diagonalRatio } = useCalculateSizeRatio()

  const color = focused ? colors.icon.accent.default : colors.icon.accent.secondary

  const iconSize: StyleProp<SvgProps> = {
    width: ICON_SIZE * diagonalRatio,
    height: ICON_SIZE * diagonalRatio,
  }

  switch (routeName) {
    case NAVIGATION_TABS_TITLE.Home:
      return <IconPicker icon="Home" iconColor={color} {...iconSize} />
    case NAVIGATION_TABS_TITLE.MyServers:
      return <IconPicker icon="Calendar" iconColor={color} {...iconSize} />
    case NAVIGATION_TABS_TITLE.Account:
      return <IconPicker icon="SquareUserRound" iconColor={color} {...iconSize} />
    default:
      return null
  }
}
