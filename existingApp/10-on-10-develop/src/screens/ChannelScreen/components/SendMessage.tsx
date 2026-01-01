import { useMutation } from "@apollo/client"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { RouteParams, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ButtonMain, IconPicker } from "@/components"
import { SEND_MESSAGE, UPLOAD_FILE_TO_CHANNEL } from "@/gql/mutations/authorizedUser/sendMessage"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { DEFAULT_PADDING_HORIZONTAL, defaultFontStyle } from "@/utils/constants"
import { ToastType } from "@/utils/constants/Toast"
import { useThemeColor } from "@/utils/hooks"

const ADDITIONAL_PADDING_VERTICAL = 8
const MIN_INPUT_HEIGHT = 48
const MAX_INPUT_HEIGHT = 48 * 4
const IMAGE_SIZE = 72

type SendMessageProps = {
  userBanned: boolean
  handleRefreshNewestMessage: () => void
}

export const SendMessage = ({ userBanned, handleRefreshNewestMessage }: SendMessageProps) => {
  const { channel } = useLocalSearchParams<RouteParams<"/main/[serverInfo]/[channel]">>()
  const { t } = useTranslation()
  const { colors } = useThemeColor()
  const { bottom } = useSafeAreaInsets()
  const { showToast } = useToast()
  const [message, setMessage] = useState("")
  const [inputFocused, setInputFocused] = useState(false)

  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE, {
    client,
  })
  const [uploadFile] = useMutation(UPLOAD_FILE_TO_CHANNEL, {
    client,
  })
  const [image, setImage] = useState<string>()
  const [loadingSendMessageWithImage, setLoadingSendMessageWithImage] = useState(false)

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.tertiary,
    paddingBottom: bottom + ADDITIONAL_PADDING_VERTICAL,
  }

  const initTextInput: StyleProp<TextStyle> = {
    backgroundColor: colors.background.over.default,
    borderColor: inputFocused ? colors.border.base.default : colors.border.base.tertiary,
    color: colors.text.base.default,
  }

  const onSendPress = async () => {
    if (image) {
      try {
        setLoadingSendMessageWithImage(true)
        const selectedImage = await (await fetch(image)).blob()
        const key = new Date().toISOString()
        const uploadResponse = await uploadFile({
          variables: {
            channelId: channel,
            key,
          },
        })
        if (!uploadResponse.data?.users?.user?.channel?.uploadFile) return
        const response = await fetch(uploadResponse.data.users?.user.channel.uploadFile.putURL, {
          method: "PUT",
          headers: {
            "Content-type": selectedImage.type,
          },
          body: selectedImage,
        })
        if (!response.ok) return
        await sendMessage({
          variables: {
            channelId: channel,
            message: {
              text: message ? message : undefined,
              attachmentsUrls: [uploadResponse.data.users.user.channel.uploadFile.getURL],
            },
          },
          onCompleted: () => {
            setImage(undefined)
            setMessage("")
          },
        })
      } catch {
        showToast({ type: ToastType.ERROR, message: t("Toast.Errors.SOMETHING_WENT_WRONG") })
      } finally {
        setLoadingSendMessageWithImage(false)
      }
    } else {
      await sendMessage({
        variables: {
          channelId: channel,
          message: {
            text: message,
          },
        },
        onError: () =>
          showToast({ type: ToastType.ERROR, message: t("Toast.Errors.SOMETHING_WENT_WRONG") }),
        onCompleted: () => {
          setMessage("")
        },
      })
    }
    handleRefreshNewestMessage()
  }

  const onPlusPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const handleImageDelete = () => setImage(undefined)

  const onFocus = () => setInputFocused(true)
  const onBlur = () => setInputFocused(false)

  return (
    <>
      <View style={[styles.container, initContainerStyle]}>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={{ flex: 1 }} />
            <Pressable
              onPress={handleImageDelete}
              style={[styles.xMark, { backgroundColor: colors.icon.accent.default }]}>
              <IconPicker icon="XMark" />
            </Pressable>
          </View>
        ) : null}
        {!userBanned ? (
          <>
            <ButtonMain
              icon={"ImageIcon"}
              buttonHeight={36}
              buttonWidth={36}
              iconHeight={24}
              iconWidth={24}
              loading={loadingSendMessageWithImage || loading}
              onPress={onPlusPress}
            />
            <TextInput
              autoCapitalize="none"
              multiline
              style={[styles.inputWrapper, defaultFontStyle.BODY_BASE, initTextInput]}
              value={message}
              onFocus={onFocus}
              onBlur={onBlur}
              onChangeText={setMessage}
            />
            <ButtonMain
              icon="SendHorizontal"
              buttonHeight={36}
              buttonWidth={36}
              iconHeight={24}
              iconWidth={24}
              loading={loadingSendMessageWithImage || loading}
              disabled={!message && !image}
              onPress={onSendPress}
            />
          </>
        ) : (
          <Text
            style={[
              styles.inputWrapper,
              defaultFontStyle.BODY_BASE,
              initTextInput,
              { textAlign: "center" },
            ]}>
            {t("Channel.YouAreBanned")}
          </Text>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    paddingTop: ADDITIONAL_PADDING_VERTICAL,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  inputWrapper: {
    flex: 1,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    paddingVertical: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  xMark: {
    position: "absolute",
    right: -12,
    top: -12,
    padding: 2,
    borderRadius: 24,
  },
  imageContainer: {
    position: "absolute",
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    top: -IMAGE_SIZE - 12,
    left: 20,
  },
})
