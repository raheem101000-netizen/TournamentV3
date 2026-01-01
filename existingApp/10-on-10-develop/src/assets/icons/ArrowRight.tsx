import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const ArrowRight = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M5 12h14m0 0l-7-7m7 7l-7 7"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
