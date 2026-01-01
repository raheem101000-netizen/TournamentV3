import { Image } from "expo-image"
import { useTranslation } from "react-i18next"
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"

import { IconPicker } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { FocusedItem, MessageDetailForUser } from "../../types"
import { MessagePhoto } from "./MessagePhoto"

interface IMessageListItem {
  item: MessageDetailForUser
  userId: string | undefined
  serverHostId: string | undefined
  disableHeader?: boolean
  setFocusedItem: (item: FocusedItem) => void
  setImageUrl?: (imageUrl?: string) => void
}

type AvatarProps = {
  avatarUrl: string | undefined
  activeUser: boolean
  fullName: string | undefined
}

type PressableDotsProps = { onPress: () => void }

const Avatar = ({ avatarUrl, activeUser, fullName }: AvatarProps) => {
  const { colors } = useThemeColor()
  const initAvatarText: StyleProp<TextStyle> = {
    color: colors.text.base.default,
    textTransform: "capitalize",
  }

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          backgroundColor: !activeUser
            ? colors.background.accent.default
            : colors.background.accent.secondary,
        },
      ]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ height: 24, width: 24 }} contentFit="fill" />
      ) : (
        <Text style={[defaultFontStyle.BODY_SMALL, initAvatarText]}>{fullName?.slice(0, 1)}</Text>
      )}
    </View>
  )
}

const PressableDots = ({ onPress }: PressableDotsProps) => {
  return (
    <Pressable hitSlop={4} onPress={onPress}>
      <IconPicker icon="DotsVertical" />
    </Pressable>
  )
}

export const MessageListItem = ({
  item,
  userId,
  serverHostId,
  setFocusedItem,
  setImageUrl,
}: IMessageListItem) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const activeUser = item.user._id === userId

  const initAvatarAndUserInformationContainer: StyleProp<ViewStyle> = {
    alignSelf: activeUser ? "flex-end" : "flex-start",
  }

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: activeUser
      ? colors.background.accent.default
      : colors.background.accent.secondary,
    borderColor: colors.background.accent.secondary,
  }

  const onImagePress = () => setImageUrl?.(item.attachmentsUrls?.[0]?.image)

  const handleFocusItem = () => setFocusedItem({ item })

  return (
    <View style={styles.container}>
      {!item.sameUser ? (
        <View style={[styles.centerRow, initAvatarAndUserInformationContainer]}>
          {!activeUser ? (
            <Avatar
              activeUser={activeUser}
              avatarUrl={item.user.avatarUrl}
              fullName={item.user.fullName}
            />
          ) : null}
          <Text style={[defaultFontStyle.BODY_BASE, { color: colors.text.base.default }]}>
            {item.user.fullName}
          </Text>
          {serverHostId === item.user._id && !activeUser ? (
            <View
              style={[styles.adminWrapper, { backgroundColor: colors.background.accent.default }]}>
              <Text
                style={[
                  styles.adminWrapper,
                  defaultFontStyle.BODY_XS_STRONG,
                  { color: colors.text.base.default },
                ]}>
                {t("Channel.Admin")}
              </Text>
            </View>
          ) : null}
          {activeUser ? (
            <Avatar
              activeUser={activeUser}
              avatarUrl={item.user.avatarUrl}
              fullName={item.user.fullName}
            />
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          styles.centerRow,
          {
            alignSelf: activeUser ? "flex-end" : "flex-start",
          },
        ]}>
        {activeUser ? <PressableDots onPress={handleFocusItem} /> : null}
        <View style={[styles.messageContainer, initContainerStyle]}>
          <View style={styles.imageAndMessage}>
            <MessagePhoto
              attachementUrls={item.attachmentsUrls?.[0]?.image_thumbnail}
              onImagePress={onImagePress}
            />
            {item.text ? (
              <Text
                style={[defaultFontStyle.SINGLE_LINE_SMALL, { color: colors.text.base.secondary }]}>
                {item.text}
              </Text>
            ) : null}
          </View>
        </View>
        {!activeUser ? <PressableDots onPress={handleFocusItem} /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  messageContainer: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    maxWidth: "80%",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageAndMessage: {
    alignItems: "flex-end",
    gap: 8,
  },
  adminWrapper: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  avatarContainer: {
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    overflow: "hidden",
  },
})
