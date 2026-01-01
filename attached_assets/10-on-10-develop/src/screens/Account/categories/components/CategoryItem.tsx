import { ReactNode } from "react"
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { CustomButton, CustomButtonVariants } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ICategoryItem {
  leftComponent: ReactNode | string
  rightComponentText?: string
  rightComponentPress?: () => void
}

export const CategoryItem = ({
  leftComponent,
  rightComponentPress,
  rightComponentText,
}: ICategoryItem) => {
  const LeftComponent = () => {
    const { colors } = useThemeColor()

    const initTextStyle: StyleProp<TextStyle> = {
      color: colors.text.base.default,
    }

    switch (typeof leftComponent) {
      case "string":
        return <Text style={[defaultFontStyle.BODY_BASE, initTextStyle]}>{leftComponent}</Text>

      default:
        return leftComponent
    }
  }

  return (
    <View style={styles.container}>
      <LeftComponent />
      {rightComponentText && rightComponentPress ? (
        <CustomButton
          buttonTitle={rightComponentText}
          onPress={rightComponentPress}
          variant={CustomButtonVariants.STAND_ALONE}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
