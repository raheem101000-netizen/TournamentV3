import { memo } from "react"
import { SvgProps } from "react-native-svg"

import * as Icons from "@/assets/icons"
import { IconName, IconNameWithDefaultColor } from "@/utils/types/sharedComponents/icons"

type SelectedIconProp = { icon: IconNameWithDefaultColor } | { icon: IconName; iconColor?: string }

type IconPickerComponentProps = SvgProps & SelectedIconProp

const IconPickerComponent = ({ icon, ...props }: IconPickerComponentProps) => {
  const SelectedIcon = Icons[icon]

  return <SelectedIcon {...props} />
}

export const IconPicker = memo(IconPickerComponent)
