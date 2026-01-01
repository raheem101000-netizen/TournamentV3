import { useLazyQuery } from "@apollo/client"
import { useRouter } from "expo-router"
import { DefaultValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  AuthForm,
  CustomAwareView,
  CustomButton,
  CustomButtonVariants,
  FormDataType,
  ScreenView,
} from "@/components"
import { USER_LOGIN } from "@/gql/"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { ToastType } from "@/utils/constants/Toast"
import { storeTokens } from "@/utils/helpers"

const GAP = 16

const DEFAULT_VALUES: DefaultValues<FormDataType<"loginSchema">> = {
  email: "",
  password: "",
}

export const LoginScreen = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { replace, push } = useRouter()

  const [login, { loading }] = useLazyQuery(USER_LOGIN, {
    client,
  })

  const onForgotPress = () => push("/auth/ResetPassword")

  const onConfirmPress = ({ email, password }: FormDataType<"loginSchema">) => {
    login({
      variables: {
        user: { username: email.toLowerCase(), password },
      },
      onError: async () => {
        showToast({ type: ToastType.ERROR, message: t("Toast.Errors.SOMETHING_WENT_WRONG") })
        await storeTokens({
          refreshToken: undefined,
          token: undefined,
        })
      },

      onCompleted: async ({ users }) => {
        if (!users?.publicUsers?.login.password) return
        const { accessToken, hasError, refreshToken } = users.publicUsers.login.password
        if (hasError) {
          return showToast({ message: t(`Toast.Errors.${hasError}`), type: ToastType.ERROR })
        }
        if (accessToken && refreshToken) {
          await storeTokens({
            refreshToken,
            token: accessToken,
          }).then(() => replace("/"))
        }
      },
    })
  }

  return (
    <ScreenView removeTopInset removeBottomInset removeHorizontalPadding>
      <CustomAwareView insetBottom>
        <View style={styles.container}>
          <View style={styles.formContainer}>
            <AuthForm
              defaultValues={DEFAULT_VALUES}
              loadingSubmit={loading}
              schema="loginSchema"
              confirmButtonTitle={t("Auth.LogIn")}
              handleSubmit={onConfirmPress}
            />
            <View style={styles.forgotWrapper}>
              <CustomButton
                variant={CustomButtonVariants.STAND_ALONE}
                buttonTitle={t("Auth.Reset.ForgotPassword")}
                onPress={onForgotPress}
              />
            </View>
          </View>
        </View>
      </CustomAwareView>
    </ScreenView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  formContainer: { gap: GAP },
  forgotWrapper: { alignSelf: "flex-start" },
})

export default LoginScreen
