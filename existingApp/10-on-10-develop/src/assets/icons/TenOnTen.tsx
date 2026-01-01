import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

const WIDTH = 139
const HEIGHT = 42

export const TenOnTen = (props: SvgProps) => {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 139 42" fill="none" {...props}>
      <Path
        d="M93.004.723h4.086v30.936h5.373v4.62H87.648v-4.62h5.356V4.873h-4.376V.723h4.376z"
        fill="#fff"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M118.759.723l-5.185 5.185v25.555l5.185 4.815h15.556l4.444-4.815V5.908L134.315.723h-15.556zm-.741 5.926l2.223-2.222h11.852l2.222 2.222v23.703l-2.222 2.223h-11.852l-2.223-2.223V6.65z"
        fill="#fff"
      />
      <Path
        d="M5.597.723h4.085v30.936h5.374v4.62H.241v-4.62h5.356V4.873H1.22V.723h4.376z"
        fill="#fff"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31.352.723l-5.185 5.185v25.555l5.185 4.815h15.556l4.444-4.815V5.908L46.908.723H31.352zm-.74 5.926l2.222-2.222h11.852l2.222 2.222v23.703l-2.222 2.223H32.834l-2.222-2.223V6.65z"
        fill="#fff"
      />
      <Path d="M75.024.723h4.17l-14.832 40.74h-4.12L75.023.723z" fill="#fff" />
    </Svg>
  )
}
