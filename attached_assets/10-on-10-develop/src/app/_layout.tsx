import "@/translations/i18n"

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { Fonts } from "@/assets/fonts"
import { DoubleButtonModal, SubScreenHeader } from "@/components"
import { ApolloProvider } from "@/providers/ApolloProvider"
import { AuthProvider } from "@/providers/AuthProvider"
import { CmsApolloProvider } from "@/providers/CmsApolloProvider"
import { ToastProvider } from "@/providers/ToastProvider"
import { useExitBackHandler } from "@/utils/helpers/hook"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const Init = () => {
  const { t } = useTranslation()
  const [showExitModal, setShowExitModal] = useState(false)

  const closeModal = () => setShowExitModal(false)
  const showModal = () => setShowExitModal(true)

  const onConfirmButtonPress = () => {
    BackHandler.exitApp()
  }

  useExitBackHandler({
    onBackPress: showModal,
  })

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} initialRouteName="index">
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="main" />
        <Stack.Screen
          name="Privacy"
          options={{
            headerShown: true,
            animation: "fade_from_bottom",
            title: t("Common.TabsHeader.PrivacyPolicy"),
            header: props => <SubScreenHeader backIcon="ChevronLeft" {...props} />,
            presentation: "fullScreenModal",
          }}
        />
      </Stack>
      <DoubleButtonModal
        visible={showExitModal}
        title={t("Common.ExitModal.Title")}
        description={t("Common.ExitModal.Description")}
        confirmButtonTitle={t("Common.ExitModal.ConfirmButtonTitle")}
        closeModal={closeModal}
        onConfirmButtonPress={onConfirmButtonPress}
      />
    </>
  )
}

const RootLayout = () => {
  const [loaded] = useFonts(Fonts)

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])
  return loaded ? (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <KeyboardProvider statusBarTranslucent>
          <ApolloProvider>
            <CmsApolloProvider>
              <AuthProvider>
                <ToastProvider>
                  <BottomSheetModalProvider>
                    <Init />
                  </BottomSheetModalProvider>
                </ToastProvider>
              </AuthProvider>
            </CmsApolloProvider>
          </ApolloProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  ) : null
}

export default RootLayout
