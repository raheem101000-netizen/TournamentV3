import { Pressable, StyleSheet, Text, View } from "react-native"

import { IconPicker } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { PlayerItemProps } from "./types"

interface IPlayerItem {
  item: PlayerItemProps
  myId: string | undefined
  onExpandPress: (selectedPlayer: string) => void
}

type PressableDotsProps = {
  onPress: () => void
}

const PressableDots = ({ onPress }: PressableDotsProps) => {
  return (
    <Pressable hitSlop={4} onPress={onPress}>
      <IconPicker icon="DotsVertical" />
    </Pressable>
  )
}

export const PlayerItem = ({ item, myId, onExpandPress }: IPlayerItem) => {
  const { colors } = useThemeColor()

  const onPress = () => onExpandPress(item._id)

  return (
    <View style={styles.container}>
      <View>
        <Text style={[defaultFontStyle.BODY_STRONG, { color: colors.text.base.default }]}>
          {item.fullName}
        </Text>
      </View>
      {item._id !== myId ? (
        <PressableDots onPress={onPress} />
      ) : (
        <IconPicker icon="Users" iconColor={colors.icon.accent.default} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
})
