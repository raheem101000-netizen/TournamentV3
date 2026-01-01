import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

import { useThemeColor } from "@/utils/hooks"

interface Icon extends SvgProps {
  iconColor?: string
}

export const Send = ({ iconColor, ...props }: Icon) => {
  const { colors } = useThemeColor()
  const color = iconColor ?? colors.icon.base.default
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M10.914 13.085a1.998 1.998 0 00-.67-.44l-7.93-3.18a.5.5 0 01.024-.938l19-6.5a.496.496 0 01.635.635l-6.5 19a.5.5 0 01-.937.024l-3.18-7.932a2 2 0 00-.442-.669zm0 0l10.94-10.938"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
