import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { SubScreenHeader } from "@/components"

const AuthLayout = () => {
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={{
        header: props => <SubScreenHeader backIcon="XMark" {...props} />,
        animation: "fade_from_bottom",
      }}
      initialRouteName="AuthScreen">
      <Stack.Screen name="AuthScreen" options={{ headerShown: false }} />
      <Stack.Screen name="LoginScreen" options={{ title: t("Auth.LogIn") }} />
      <Stack.Screen name="ResetPassword" options={{ title: t("Auth.ResetPassword") }} />
      <Stack.Screen name="CreateAccountScreen" options={{ title: t("Auth.CreateAccount") }} />
    </Stack>
  )
}
export default AuthLayout
