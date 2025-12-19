import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { Divider } from "@/components/Divider"
import { IconPicker } from "@/components/IconPicker"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

enum ChannelStatus {
  CLOSE = "Close",
  OPEN = "Open",
}

interface IChannelType {
  value: boolean
  onChange: (value: boolean) => void
}

interface IComponent extends IChannelType {
  type: ChannelStatus
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

const Component = ({ value, type, onChange }: IComponent) => {
  const { colors } = useThemeColor()
  const { t } = useTranslation()

  const isChannelOpen = type === ChannelStatus.OPEN

  const isSelected = value === isChannelOpen

  const selectedColor = isSelected ? colors.text.base.default : colors.text.base.tertiary

  const onComponentPress = () => onChange(isChannelOpen)

  return (
    <Pressable style={styles.container} onPress={onComponentPress}>
      <View style={styles.titleContainer}>
        <Box value={isSelected} />
        <IconPicker
          icon={type === ChannelStatus.OPEN ? "MessageSquareMore" : "Megaphone"}
          iconColor={selectedColor}
        />
        <Text style={[defaultFontStyle.BODY_STRONG, { color: selectedColor }]}>
          {t(`ServerInfo.BottomSheet.ChannelType.${type}.Title`)}{" "}
          <Text style={[defaultFontStyle.SINGLE_LINE_SMALL, { color: selectedColor }]}>
            {t(`ServerInfo.BottomSheet.ChannelType.${type}.Description`)}
          </Text>
        </Text>
      </View>
    </Pressable>
  )
}

export const ChannelType = (props: IChannelType) => {
  return (
    <>
      <Component type={ChannelStatus.OPEN} {...props} />
      <Divider />
      <Component type={ChannelStatus.CLOSE} {...props} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  boxContainer: {
    borderRadius: 4,
    padding: 4,
    borderWidth: 2,
    marginRight: 12,
  },
  box: {
    height: 8,
    width: 8,
  },
})
