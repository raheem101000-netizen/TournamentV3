import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const CalendarHeart = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 10h18V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7M8 2v4m8-4v4m5.29 8.7a2.43 2.43 0 00-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 00-3.44 0c-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74v-.01z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
