import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { AUTH_LOGO } from "@/assets/images"
import { CustomButton, CustomButtonVariants, ScreenView } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

const LOGO_GAP = 16
const MAIN_GAP = 24
const BUTTONS_GAP = 16

const AuthScreen = () => {
  const { push } = useRouter()
  const { colors } = useThemeColor()
  const { t } = useTranslation()

  const fontColor = colors.text.base.secondary

  const onLogInPress = () => push("/auth/LoginScreen")

  const onCreateAccountPress = () => push("/auth/CreateAccountScreen")

  const onGuestModePress = () => push({ pathname: "/main/tabs/Home" })

  return (
    <ScreenView>
      <View style={styles.container}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "flex-start", alignItems: "flex-end" },
          ]}>
          <CustomButton
            buttonTitle={t("Auth.GuestMode")}
            variant={CustomButtonVariants.STAND_ALONE}
            onPress={onGuestModePress}
          />
        </View>
        <View style={styles.logoAndTextContainer}>
          <Image source={AUTH_LOGO} style={styles.logo} contentFit="contain" />
          <Text style={[defaultFontStyle.BODY_BASE, styles.text, { color: fontColor }]}>
            {t("Auth.Description")}
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <CustomButton
            buttonTitle={t("Auth.LogIn")}
            variant={CustomButtonVariants.SECONDARY}
            onPress={onLogInPress}
          />
          <CustomButton
            buttonTitle={t("Auth.CreateAccount")}
            variant={CustomButtonVariants.SECONDARY}
            onPress={onCreateAccountPress}
          />
        </View>
      </View>
    </ScreenView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: MAIN_GAP,
  },
  logoAndTextContainer: { alignItems: "center", gap: LOGO_GAP },
  buttonsContainer: {
    width: "100%",
    gap: BUTTONS_GAP,
  },
  text: {
    textAlign: "center",
  },
  logo: {
    height: 180,
    width: 180,
  },
})

export default AuthScreen
