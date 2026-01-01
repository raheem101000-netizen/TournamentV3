import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { IconPicker } from "@/components/IconPicker"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ITournamentChannel {
  value: boolean
  onChange: (value: boolean) => void
}

interface IBox {
  value: boolean
}

const Box = ({ value }: IBox) => {
  const { colors } = useThemeColor()

  const borderColor = value ? colors.icon.accent.default : colors.icon.base.tertiary
  const boxColor = value ? colors.icon.accent.default : "transparent"

  return (
    <View style={[styles.boxContainer, { borderColor }]}>
      <View style={[styles.box, { backgroundColor: boxColor }]} />
    </View>
  )
}

export const TournamentChannel = ({ value, onChange }: ITournamentChannel) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const itemColor = colors.icon.base[value ? "default" : "tertiary"]

  const onPress = () => {
    onChange(!value)
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Box value={value} />
      <View style={styles.rightContainer}>
        <View style={styles.header}>
          <IconPicker icon="Tournament" iconColor={itemColor} />
          <Text style={[defaultFontStyle.BODY_STRONG, { color: itemColor }]}>
            {t("ServerInfo.BottomSheet.ChannelTournament")}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  rightContainer: {
    gap: 4,
  },
  header: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  boxContainer: {
    borderRadius: 4,
    padding: 4,
    borderWidth: 2,
  },
  box: {
    height: 8,
    width: 8,
  },
})
