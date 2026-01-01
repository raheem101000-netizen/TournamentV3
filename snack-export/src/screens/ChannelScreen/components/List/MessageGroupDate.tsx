import { format } from "date-fns"
import { StyleSheet, Text } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

type MessageGroupDateProps = {
  date: string
}

export const MessageGroupDate = ({ date }: MessageGroupDateProps) => {
  const { colors } = useThemeColor()

  return (
    <Text
      style={[defaultFontStyle.BODY_SMALL, styles.container, { color: colors.text.base.tertiary }]}>
      {format(new Date(date), "dd.MM.yyyy h:mm a")}
    </Text>
  )
}

const styles = StyleSheet.create({
  container: {
    textAlign: "center",
    paddingVertical: 12,
  },
})
