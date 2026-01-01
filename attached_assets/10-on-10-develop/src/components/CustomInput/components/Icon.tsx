import { GestureResponderEvent, Pressable, PressableProps } from "react-native"

import { IconPicker } from "@/components/IconPicker"

import { IInputIcon } from "../types"

type InputIconProps = Partial<IInputIcon["rightIcon"]> & { focusedColor: string }

export const InputIcon = (props: InputIconProps) => {
  const iconInitStyle: PressableProps["style"] = ({ pressed }) => ({
    opacity: pressed ? 0.5 : 1,
  })

  const onPress = (e: GestureResponderEvent) => {
    e.stopPropagation()
    props.onIconPress?.()
  }

  return props.icon ? (
    <Pressable hitSlop={8} style={iconInitStyle} onPress={onPress}>
      <IconPicker icon={props.icon} iconColor={props.focusedColor} />
    </Pressable>
  ) : null
}
