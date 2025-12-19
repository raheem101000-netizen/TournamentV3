import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { DEFAULT_PADDING_HORIZONTAL, defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface IListHeader {
  totalServers: number
}

export const ListHeader = ({ totalServers }: IListHeader) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const initTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }

  return (
    <View style={styles.container}>
      <Text style={[defaultFontStyle.BODY_SMALL, initTextStyle]}>{`${totalServers} ${t(
        "MyServers.ListHeader.Servers",
      )}`}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    marginBottom: 8,
  },
})
