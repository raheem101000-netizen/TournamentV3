import { Pressable, StyleProp, StyleSheet, Text, TextStyle } from "react-native"

import { ChannelProps } from "@/gql"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { ChannelSheetType } from "../CustomBottomSheet"
import { IconPicker } from "../IconPicker"

interface IChannelItem {
  item: ChannelProps
  type: ChannelSheetType
  onItemPress: (item: ChannelProps) => void
}

export const ChannelItem = ({ item, type, onItemPress }: IChannelItem) => {
  const { colors } = useThemeColor()

  const initTextStyle: StyleProp<TextStyle> = {
    flex: 1,
    color: colors.text.base.default,
  }

  const onPress = () => {
    onItemPress(item)
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <IconPicker
        icon={item.tournament ? "Tournament" : !item.open ? "Megaphone" : "MessageSquareText"}
        iconColor={colors.icon.base.secondary}
        strokeWidth={2}
      />
      <Text style={[defaultFontStyle.BODY_BASE, initTextStyle]} numberOfLines={1}>
        {item.name}
      </Text>
      <IconPicker
        icon={type === ChannelSheetType.CREATE ? "ChevronRight" : "Pencil"}
        iconColor={colors.icon.base.secondary}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    gap: 8,
  },
  tournamentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
})
