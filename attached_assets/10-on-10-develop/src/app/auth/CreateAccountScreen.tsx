import { useMutation } from "@apollo/client"
import { useRouter } from "expo-router"
import { DefaultValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { AuthForm, CustomAwareView, FormDataType, ScreenView } from "@/components"
import { REGISTER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { ToastType } from "@/utils/constants/Toast"

const GAP = 16

const DEFAULT_VALUES: DefaultValues<FormDataType<"createAccountSchema">> = {
  email: "",
  password: "",
}

const CreateAccountScreen = () => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { replace } = useRouter()

  const [register, { loading }] = useMutation(REGISTER, {
    client,
  })

  const onConfirmPress = ({ email, password, fullName }: FormDataType<"createAccountSchema">) => {
    register({
      variables: {
        user: {
          fullName,
          username: email.toLowerCase(),
          password,
        },
      },
      onCompleted: ({ users }) => {
        if (!users?.publicUsers?.register) return
        const { hasError, registered } = users.publicUsers.register

        if (hasError) {
          return showToast({ message: t(`Toast.Errors.${hasError}`), type: ToastType.ERROR })
        }
        if (registered) {
          replace("/auth/LoginScreen")
          return showToast({ message: t("Toast.Success.RegistrationSuccessful") })
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
              schema="createAccountSchema"
              confirmButtonTitle={t("Auth.CreateAccount")}
              handleSubmit={onConfirmPress}
            />
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
})

export default CreateAccountScreen
