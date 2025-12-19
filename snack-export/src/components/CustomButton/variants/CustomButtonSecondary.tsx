import { Pressable, PressableProps, StyleSheet } from "react-native"

import { useThemeColor } from "@/utils/hooks"

import { CustomButtonVariants, CustomButtonVersions } from "../constants"
import { CustomButtonProps } from "../types"
import { CustomButtonBody } from "./CustomButtonBody"

const BUTTON_SIZE = 48
const PADDING_HORIZONTAL = 12
const RADIUS = 8

export const CustomButtonSecondary = ({
  disabled,
  leftIcon,
  rightIcon,
  buttonTitle,
  loading,
  version = CustomButtonVersions.DEFAULT,
  ...props
}: CustomButtonProps<CustomButtonVariants.SECONDARY>) => {
  const { colors } = useThemeColor()

  const backgroundColor =
    disabled || loading
      ? colors.background.disabled
      : version === CustomButtonVersions.DEFAULT
        ? colors.background.accent.secondary
        : version === CustomButtonVersions.POSITIVE
          ? colors.background.success.default
          : colors.background.danger.default

  const componentsColor =
    version === CustomButtonVersions.DEFAULT
      ? colors.text.accent.default
      : version === CustomButtonVersions.POSITIVE
        ? colors.text.success.default
        : colors.text.danger.default

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
        componentsColor={componentsColor}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: BUTTON_SIZE,
    paddingHorizontal: PADDING_HORIZONTAL,
    borderRadius: RADIUS,
  },
})
