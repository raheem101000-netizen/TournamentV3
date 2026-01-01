import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleProp, Text, TextStyle } from "react-native"

import { CustomButton } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

export const ResetPasswordEnd = () => {
  const { t } = useTranslation()
  const { replace } = useRouter()
  const { colors } = useThemeColor()

  const initDescriptionTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }

  const onBackPress = () => {
    replace("/auth/AuthScreen")
  }

  return (
    <>
      <Text style={[defaultFontStyle.SUBHEADING, initDescriptionTextStyle]}>
        {t("Auth.Reset.EndResetPasswordDescription")}
      </Text>
      <CustomButton buttonTitle={t("Auth.Reset.BackToLogIn")} onPress={onBackPress} />
    </>
  )
}
