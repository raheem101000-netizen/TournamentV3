import React from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

import { IconPicker } from "@/components/IconPicker"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"
import { IconName, IconNameWithDefaultColor } from "@/utils/types/sharedComponents/icons"

import { ICustomButtonBody } from "../types"

interface IIcon {
  icon?: IconName | IconNameWithDefaultColor
  iconColor?: string
}

const GAP = 4

const Icon = ({ icon, iconColor }: IIcon) => {
  return icon ? (
    icon !== "GoogleIcon" ? (
      <IconPicker icon={icon} iconColor={iconColor} />
    ) : (
      <IconPicker icon={icon} />
    )
  ) : null
}

export const CustomButtonBody = ({
  buttonTitle,
  componentsColor,
  disabled,
  leftIcon,
  rightIcon,
  loading,
}: ICustomButtonBody) => {
  const { colors } = useThemeColor()
  const color = disabled ? colors.text.disabled : componentsColor

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size={"small"} color={componentsColor} />
      ) : (
        <>
          <Icon icon={leftIcon} iconColor={color} />
          {buttonTitle ? (
            <View>
              <Text style={[defaultFontStyle.SINGLE_LINE_SMALL_UPC, { color }]}>{buttonTitle}</Text>
            </View>
          ) : null}
          <Icon icon={rightIcon} iconColor={color} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: GAP,
  },
})
