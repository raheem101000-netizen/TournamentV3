import { useLazyQuery } from "@apollo/client"
import { useRouter } from "expo-router"
import { DefaultValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { AuthForm, CustomButton, CustomButtonVariants, FormDataType } from "@/components"
import { REQUEST_FORGOT_PASSWORD } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { RESET_PASSWORD_STAGE } from "./constants"
import { StageProps } from "./types"

const GAP_DONT_HAVE_ACCOUNT = 8

const DEFAULT_VALUES: DefaultValues<FormDataType<"requestForForgotPassword">> = {
  email: "",
}

interface IRequestResetPassword {
  setStage: (props: StageProps<RESET_PASSWORD_STAGE.RESET>) => void
}

export const RequestResetPassword = ({ setStage }: IRequestResetPassword) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()
  const { replace } = useRouter()

  const [resetPasswordRequest, { loading: resetPasswordLoading }] = useLazyQuery(
    REQUEST_FORGOT_PASSWORD,
    {
      client,
    },
  )

  const initDescriptionTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.tertiary,
  }

  const initDontHaveAccountStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }

  const requestResetPassword = async ({ email }: FormDataType<"requestForForgotPassword">) => {
    await resetPasswordRequest({
      variables: { username: email.toLowerCase() },
      onCompleted: ({ users }) => {
        if (users?.publicUsers?.requestForForgotPassword) {
          setStage({
            stage: RESET_PASSWORD_STAGE.RESET,
            email,
          })
        }
      },
    })
  }

  const onCreateAccountPress = () => replace("/auth/CreateAccountScreen")

  return (
    <>
      <Text style={[defaultFontStyle.BODY_BASE, initDescriptionTextStyle]}>
        {t("Auth.Reset.RequestPasswordDescription")}
      </Text>
      <AuthForm
        defaultValues={DEFAULT_VALUES}
        loadingSubmit={resetPasswordLoading}
        schema="requestForForgotPassword"
        confirmButtonTitle={t("Auth.Reset.SendLink")}
        handleSubmit={requestResetPassword}
      />
      <View style={styles.forgotWrapper}>
        <Text style={[defaultFontStyle.BODY_BASE, initDontHaveAccountStyle]}>
          {t("Auth.Reset.DontHaveAnAccount")}
        </Text>
        <CustomButton
          variant={CustomButtonVariants.STAND_ALONE}
          buttonTitle={t("Auth.CreateAccount")}
          onPress={onCreateAccountPress}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  forgotWrapper: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: GAP_DONT_HAVE_ACCOUNT,
  },
})
