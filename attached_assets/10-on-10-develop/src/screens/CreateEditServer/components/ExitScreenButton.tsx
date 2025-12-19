import { Pressable } from "react-native"

import { IconPicker } from "@/components"

interface IExitScreenButton {
  onPress: () => void
}

export const ExitScreenButton = ({ onPress }: IExitScreenButton) => {
  return (
    <Pressable onPress={onPress}>
      <IconPicker icon="XMark" />
    </Pressable>
  )
}
