import { Pressable, StyleSheet, Text } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { CustomIndicator } from "./CustomIndicator"

type SheetComponentProps = {
  title: string
  loading?: boolean
  textColor?: string
  onPress: () => void
}

export const SheetComponent = ({ title, loading, textColor, onPress }: SheetComponentProps) => {
  const { colors } = useThemeColor()

  const color = textColor ?? colors.text.base.default

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {loading ? (
        <CustomIndicator indicatorColor={color} indicatorSize={"small"} />
      ) : (
        <Text style={[defaultFontStyle.BODY_LINK, { color, fontSize: 16 }]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
  },
})
