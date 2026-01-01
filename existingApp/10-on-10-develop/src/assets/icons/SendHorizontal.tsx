import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const SendHorizontal = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M22 12a.5.5 0 01-.285.452l-18 8.5a.497.497 0 01-.682-.627l2.842-7.627a2 2 0 000-1.396L3.032 3.675a.498.498 0 01.683-.627l18 8.5A.5.5 0 0122 12zm0 0H6"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
