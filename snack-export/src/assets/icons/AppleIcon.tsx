import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const AppleIcon = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M19.55 8.158a4.758 4.758 0 00-2.273 4.002 4.63 4.63 0 002.818 4.246 11.064 11.064 0 01-1.443 2.98c-.898 1.294-1.837 2.587-3.267 2.587-1.428 0-1.796-.83-3.443-.83-1.606 0-2.178.857-3.484.857-1.307 0-2.219-1.198-3.267-2.668A12.893 12.893 0 013 12.377C3 8.294 5.654 6.13 8.267 6.13c1.389 0 2.545.912 3.417.912.83 0 2.123-.966 3.702-.966a4.952 4.952 0 014.164 2.082zm-4.913-3.81a4.693 4.693 0 001.116-2.926 2.018 2.018 0 00-.04-.422 4.703 4.703 0 00-3.09 1.592 4.563 4.563 0 00-1.157 2.845c0 .128.014.256.04.381.095.018.19.027.286.027a4.077 4.077 0 002.845-1.498z"
        fill={color}
      />
    </Svg>
  )
}
