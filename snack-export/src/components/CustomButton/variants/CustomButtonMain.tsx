import { Pressable, PressableProps, StyleSheet } from "react-native"

import { useThemeColor } from "@/utils/hooks"

import { CustomButtonVariants } from "../constants"
import { CustomButtonProps } from "../types"
import { CustomButtonBody } from "./CustomButtonBody"

const BUTTON_SIZE = 48

export const CustomButtonMain = ({
  disabled,
  leftIcon,
  rightIcon,
  buttonTitle,
  loading,
  ...props
}: CustomButtonProps<CustomButtonVariants.MAIN>) => {
  const { colors } = useThemeColor()

  const backgroundColor =
    disabled || loading ? colors.background.disabled : colors.background.accent.default

  const pressableInitStyle: PressableProps["style"] = ({ pressed }) => [
    styles.container,
    {
      backgroundColor,
      opacity: pressed ? 0.5 : 1,
    },
  ]

  return (
    <Pressable disabled={disabled || loading} style={pressableInitStyle} {...props}>
      <CustomButtonBody
        disabled={disabled || loading}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        buttonTitle={buttonTitle}
        loading={loading}
        componentsColor={colors.text.base.default}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: BUTTON_SIZE,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
})
