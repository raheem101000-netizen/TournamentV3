import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const Tournament = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12.004 17v-3M18 5h2a1 1 0 011 1v1a3 3 0 01-3 3M6 5H4a1 1 0 00-1 1v1a3 3 0 003 3m6 4a6 6 0 01-6-6V4a1 1 0 011-1h10a1 1 0 011 1v4a6 6 0 01-6 6zm5 6v-2a1 1 0 00-1-1H8a1 1 0 00-1 1v2a1 1 0 001 1h8a1 1 0 001-1z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  )
}
