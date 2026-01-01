import { Pressable, PressableProps, StyleSheet } from "react-native"

import { useThemeColor } from "@/utils/hooks"

import { CustomButtonVariants, CustomButtonVersions } from "../constants"
import { CustomButtonProps } from "../types"
import { CustomButtonBody } from "./CustomButtonBody"

const BUTTON_SIZE = 24

export const CustomButtonStandAlone = ({
  disabled,
  leftIcon,
  rightIcon,
  buttonTitle,
  loading,
  version = CustomButtonVersions.DEFAULT,
  ...props
}: CustomButtonProps<CustomButtonVariants.STAND_ALONE>) => {
  const { colors } = useThemeColor()

  const pressableInitStyle: PressableProps["style"] = ({ pressed }) => [
    styles.container,

    { opacity: pressed ? 0.5 : 1 },
  ]

  const componentsColor =
    version === CustomButtonVersions.DEFAULT
      ? colors.text.accent.default
      : version === CustomButtonVersions.POSITIVE
        ? colors.text.success.default
        : colors.text.danger.default

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
    height: BUTTON_SIZE,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
})
