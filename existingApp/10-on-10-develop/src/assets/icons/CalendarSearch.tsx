import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const CalendarSearch = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M16 2v4m5 5.75V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7.25M22 22l-1.875-1.875M3 10h18M8 2v4m13 12a3 3 0 11-6 0 3 3 0 016 0z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
