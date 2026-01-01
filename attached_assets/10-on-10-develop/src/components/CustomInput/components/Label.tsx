import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ILabel {
  labelText: string
  required?: boolean
}

export const Label = ({ labelText }: ILabel) => {
  const { colors } = useThemeColor()

  const initTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.tertiary,
  }
  const initRequiredStyle: StyleProp<TextStyle> = {
    color: colors.text.danger.default,
  }

  return (
    <View style={styles.container}>
      <Text style={[defaultFontStyle.BODY_SMALL, initTextStyle]}>
        <Text style={initRequiredStyle}>{"*"}</Text>
        {labelText}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 4 },
})
