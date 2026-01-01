import { useMutation } from "@apollo/client"
import { BottomSheetModal } from "@gorhom/bottom-sheet"
import { manipulateAsync } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Image,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { CustomBottomSheet } from "@/components/CustomBottomSheet"
import { CustomButton, CustomButtonVariants } from "@/components/CustomButton"
import { ScreenView } from "@/components/CustomViews"
import { EDIT_USER, GET_USER, UPLOAD_IMAGE, UserSelector } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { IMAGE_SIZE } from "@/screens/Home/constants"
import { defaultFontStyle } from "@/utils/constants"
import { ToastType } from "@/utils/constants/Toast"
import { useCalculateSizeRatio, useThemeColor } from "@/utils/hooks"

interface IAvatarPicker {
  user: UserSelector | undefined
}

interface IAvatar {
  uri: string | undefined
  fullName: string | undefined
}

const Avatar = ({ fullName, uri }: IAvatar) => {
  const { diagonalRatio } = useCalculateSizeRatio()
  const { colors } = useThemeColor()

  const [imageLoading, setImageLoading] = useState(!!uri)

  const initImageWrapper: StyleProp<ImageStyle> = {
    height: IMAGE_SIZE * diagonalRatio,
    width: IMAGE_SIZE * diagonalRatio,
    borderRadius: IMAGE_SIZE * diagonalRatio,
  }

  const initAvatarLetterWrapper: StyleProp<ViewStyle> = {
    height: IMAGE_SIZE * diagonalRatio,
    width: IMAGE_SIZE * diagonalRatio,
    borderRadius: IMAGE_SIZE * diagonalRatio,
    backgroundColor: colors.background.accent.default,
  }

  const textDefaultSecond: StyleProp<TextStyle> = { color: colors.text.base.secondary }

  const onLoadEnd = () => setImageLoading(false)

  if (!uri) {
    return (
      <View style={[initAvatarLetterWrapper, styles.container]}>
        <Text style={[defaultFontStyle.TITLE_PAGE, styles.imageText, textDefaultSecond]}>
          {fullName?.slice(0, 1)}
        </Text>
      </View>
    )
  }

  return (
    <>
      {uri ? <Image source={{ uri }} style={initImageWrapper} onLoadEnd={onLoadEnd} /> : null}
      {imageLoading ? (
        <View style={[StyleSheet.absoluteFill, initAvatarLetterWrapper, styles.container]}>
          <Text style={[defaultFontStyle.TITLE_PAGE, styles.imageText, textDefaultSecond]}>
            {fullName?.slice(0, 1)}
          </Text>
        </View>
      ) : null}
    </>
  )
}

export const AvatarPicker = ({ user }: IAvatarPicker) => {
  const sheetRef = useRef<BottomSheetModal>(null)
  const { showToast } = useToast()
  const { t } = useTranslation()

  const [avatar, setAvatar] = useState<string>()

  const [loadingChangeAvatar, setLoadingChangeAvatar] = useState(false)

  const [uploadImage] = useMutation(UPLOAD_IMAGE, {
    client,
  })
  const [editUserAvatar] = useMutation(EDIT_USER, {
    client,
  })

  const onAvatarPress = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (result.granted) {
      sheetRef.current?.present()
    } else {
      showToast({
        message: t("Toast.Warning.MediaLibraryPermissionDenied"),
        type: ToastType.WARNING,
      })
    }
  }

  const onBottomSheetSavePress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setAvatar(result.assets[0].uri)
    }
  }

  const onAvatarSavePress = async () => {
    if (!avatar) return
    setLoadingChangeAvatar(true)
    const resizedPhoto = await manipulateAsync(avatar, [{ resize: { height: 100 } }])
    const selectedAvatar = await (await fetch(resizedPhoto.uri)).blob()
    const uploadResponse = await uploadImage({
      variables: {
        imageKey: "avatar",
      },
    })
    if (!uploadResponse.data?.users?.user?.uploadFile?.putURL) return

    await fetch(uploadResponse.data?.users?.user?.uploadFile?.putURL, {
      method: "PUT",
      headers: {
        "Content-type": selectedAvatar.type,
      },
      body: selectedAvatar,
    })

    await editUserAvatar({
      variables: {
        updateUserInput: {
          avatarUrl: "avatar",
        },
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: GET_USER,
        },
      ],
      onCompleted: ({ users }) => {
        const editUser = users?.user?.editUser
        if (!editUser) return
        const { hasError, result } = editUser
        if (hasError) {
          showToast({
            message: t(`Toast.Errors.${hasError}`),
            type: ToastType.ERROR,
          })
        }
        if (result) {
          showToast({
            message: t("Toast.Success.AvatarChanged"),
            type: ToastType.SUCCESS,
          })
        }
      },
    })
    setLoadingChangeAvatar(false)
  }

  const onBottomSheetDismiss = useCallback(() => {
    setAvatar(undefined)
  }, [])

  return (
    <>
      <Pressable onPress={onAvatarPress}>
        <Avatar fullName={user?.fullName} uri={user?.avatarUrl} />
      </Pressable>
      <CustomBottomSheet
        sheetRef={sheetRef}
        snapPoints={["30%"]}
        buttonTitle={t("Account.BottomSheet.ButtonTitle")}
        title={t("Account.BottomSheet.Title")}
        onPress={onBottomSheetSavePress}
        onDismiss={onBottomSheetDismiss}>
        <ScreenView removeTopInset>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.avatarBottomSheetWrapper}>
              <Avatar fullName={user?.fullName} uri={avatar ?? user?.avatarUrl} />
            </View>
            <CustomButton
              variant={CustomButtonVariants.SECONDARY}
              buttonTitle={t("Account.BottomSheet.AvatarChangeButtonTitle")}
              disabled={!avatar}
              loading={loadingChangeAvatar}
              onPress={onAvatarSavePress}
            />
          </View>
        </ScreenView>
      </CustomBottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  imageText: {
    textTransform: "capitalize",
  },
  avatarBottomSheetWrapper: {
    alignSelf: "center",
  },
})
