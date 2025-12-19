import { useRef, useState } from "react"
import {
  NativeSyntheticEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { FullScreenIndicator } from "../CustomIndicator"
import { InputIcon, Label } from "./components"
import { IInputIcon } from "./types"

const MIN_INPUT_HEIGHT = 48
const MAX_INPUT_HEIGHT = MIN_INPUT_HEIGHT * 2.5

export type CustomInputProps = Omit<TextInputProps, "onPress"> &
  IInputIcon & {
    labelText?: string
    disableLabel?: boolean
    error?: boolean
    required?: boolean
    loading?: boolean
    onPress?: () => void
  }

export const CustomInput = ({
  labelText,
  disableLabel = false,
  rightIcon,
  error,
  required,
  loading,
  onBlur,
  onFocus,
  ...props
}: CustomInputProps) => {
  const { colors } = useThemeColor()
  const inputRef = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState(false)

  const customLabelText = labelText ? labelText : props.placeholder

  const focusedColor = isFocused ? colors.text.base.default : colors.text.base.tertiary

  const initPressableStyle: StyleProp<ViewStyle> = {
    ...styles.container,
    backgroundColor: colors.background.over.default,
    paddingRight: props.multiline ? 2 : 16,
    height: props.multiline ? MAX_INPUT_HEIGHT : MIN_INPUT_HEIGHT,
    borderColor: error
      ? colors.border.danger.default
      : isFocused
        ? colors.border.accent.default
        : colors.border.base.tertiary,
  }

  const initInputStyle: StyleProp<TextStyle> = {
    ...defaultFontStyle.BODY_BASE,
    ...styles.textInput,
    paddingRight: props.multiline ? 14 : 0,
    color: props.value ? colors.text.base.default : focusedColor,
  }

  const onPress = () => {
    props.onPress && props.onPress()
    inputRef.current?.focus()
  }

  const onIconPress = () => {
    onPress()
    rightIcon && rightIcon.onIconPress && rightIcon.onIconPress()
  }

  const onFocusInput = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true)
    onFocus && onFocus(event)
  }

  const onBlurInput = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false)
    onBlur && onBlur(event)
  }

  return (
    <View>
      {!disableLabel && !!customLabelText ? (
        <Label labelText={customLabelText} required={required} />
      ) : null}
      <Pressable style={initPressableStyle} onPress={onPress}>
        {loading ? (
          <FullScreenIndicator indicatorSize={"small"} indicatorColor={colors.text.base.tertiary} />
        ) : (
          <>
            <TextInput
              ref={inputRef}
              style={initInputStyle}
              placeholderTextColor={colors.text.base.tertiary}
              autoComplete="off"
              onFocus={onFocusInput}
              onBlur={onBlurInput}
              {...props}
            />
            <InputIcon
              icon={rightIcon?.icon}
              focusedColor={focusedColor}
              onIconPress={onIconPress}
            />
          </>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    gap: 8,
    borderRadius: 8,
    paddingLeft: 16,
  },
  textInput: {
    height: "100%",
    paddingVertical: 12,
    flex: 1,
  },
})
