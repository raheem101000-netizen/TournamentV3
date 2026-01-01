import { useMutation } from "@apollo/client"
import { DefaultValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { StyleProp, Text, TextStyle } from "react-native"

import { AuthForm, FormDataType } from "@/components"
import { CHANGE_PASSWORD_WITH_TOKEN } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { RESET_PASSWORD_STAGE } from "./constants"
import { StageProps } from "./types"

const DEFAULT_VALUES: DefaultValues<FormDataType<"resetPasswordSchema">> = {
  newPassword: "",
  forgotToken: "",
}

interface IResetPassword {
  stage: StageProps<RESET_PASSWORD_STAGE.RESET>
  setStage: (props: StageProps<RESET_PASSWORD_STAGE.END>) => void
}

export const ResetPassword = ({ setStage, stage }: IResetPassword) => {
  const { t } = useTranslation()

  const { colors } = useThemeColor()
  const { showToast } = useToast()

  const [resetPasswordWithToken, { loading }] = useMutation(CHANGE_PASSWORD_WITH_TOKEN, {
    client,
  })

  const initDescriptionTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.tertiary,
  }

  const resetPassword = ({ forgotToken, newPassword }: FormDataType<"resetPasswordSchema">) => {
    stage.email &&
      resetPasswordWithToken({
        variables: {
          token: {
            forgotToken,
            newPassword,
            username: stage.email,
          },
        },
        onCompleted: ({ users }) => {
          if (!users?.publicUsers?.changePasswordWithToken) return
          const { hasError, result } = users.publicUsers.changePasswordWithToken
          if (hasError) {
            return showToast({ message: t(`Toast.Errors.${hasError}`) })
          }
          if (result) {
            setStage({ stage: RESET_PASSWORD_STAGE.END })
          }
        },
      })
  }

  return (
    <>
      <Text style={[defaultFontStyle.BODY_BASE, initDescriptionTextStyle]}>
        {t("Auth.Reset.ResetPasswordDescription")}
      </Text>
      <AuthForm
        defaultValues={DEFAULT_VALUES}
        loadingSubmit={loading}
        schema="resetPasswordSchema"
        confirmButtonTitle={t("Auth.Reset.Confirm")}
        handleSubmit={resetPassword}
      />
    </>
  )
}
