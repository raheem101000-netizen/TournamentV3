import { useTranslation } from "react-i18next"
import { StyleProp, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CustomButton, CustomButtonVariants } from "@/components"
import {
  DEFAULT_PADDING_BOTTOM,
  DEFAULT_PADDING_HORIZONTAL,
  DEFAULT_PADDING_TOP,
} from "@/utils/constants"
import { CREATE_EDIT_PARAM } from "@/utils/constants/Screens/CreateEditServerParams"
import { useThemeColor } from "@/utils/hooks"

import { MainCreateEditProps } from "../../types"

interface ICreateEditButton extends MainCreateEditProps {
  buttonLoading: boolean
  buttonDisabled: boolean
  onPress: () => void
}

export const CreateEditButton = ({
  serverInfo,
  buttonDisabled,
  buttonLoading,
  onPress,
}: ICreateEditButton) => {
  const { bottom } = useSafeAreaInsets()
  const { colors } = useThemeColor()
  const { t } = useTranslation()

  const initContainerStyle: StyleProp<ViewStyle> = {
    paddingTop: DEFAULT_PADDING_TOP,
    paddingBottom: bottom + DEFAULT_PADDING_BOTTOM,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    backgroundColor: colors.background.accent.secondary,
  }

  const buttonTitle =
    serverInfo === CREATE_EDIT_PARAM.CREATE
      ? t("CreateEditServer.Form.Button.CreateServer")
      : t("CreateEditServer.Form.Button.EditServer")

  return (
    <View style={initContainerStyle}>
      <CustomButton
        variant={CustomButtonVariants.MAIN}
        disabled={buttonDisabled}
        loading={buttonLoading}
        buttonTitle={buttonTitle}
        onPress={onPress}
      />
    </View>
  )
}
