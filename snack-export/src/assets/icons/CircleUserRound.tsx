import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const CircleUserRound = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 20a6 6 0 00-6-6m0 0a6 6 0 00-6 6m6-6a4 4 0 100-8 4 4 0 000 8zm10-2c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
