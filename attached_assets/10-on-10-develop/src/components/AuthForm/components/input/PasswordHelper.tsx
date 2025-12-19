import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { IconPicker } from "@/components/IconPicker"
import { defaultFontStyle } from "@/utils/constants"
import { PASSWORD_SCHEMA_ERRORS } from "@/utils/helpers/schema/default"
import { useThemeColor } from "@/utils/hooks"

interface IPasswordHelper {
  isSubmitted: boolean
  error: string | undefined
}

interface IHelperText {
  errorExist: boolean
  isSubmitted: boolean
  text: string
}
const GAP = 4
const MARGIN_TOP = 8

const HelperText = ({ errorExist, isSubmitted, text }: IHelperText) => {
  const { colors } = useThemeColor()

  const color = !isSubmitted
    ? colors.text.disabled
    : errorExist
      ? colors.text.danger.default
      : colors.text.success.default

  return (
    <View style={styles.helperContainer}>
      <IconPicker icon={errorExist ? "XMark" : "Check"} iconColor={color} />
      <Text style={[defaultFontStyle.BODY_BASE, { color }]}>{text}</Text>
    </View>
  )
}

const UPPER_LOWER_CASE_CHECK = [
  PASSWORD_SCHEMA_ERRORS.LOWER_CASE_MISSING,
  PASSWORD_SCHEMA_ERRORS.UPPER_CASE_MISSING,
]

export const PasswordHelper = ({ error, isSubmitted }: IPasswordHelper) => {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <HelperText
        text={t("Auth.Form.Helpers.AtLeast8")}
        isSubmitted={isSubmitted}
        errorExist={!!error?.includes(PASSWORD_SCHEMA_ERRORS.AT_LEAST_8)}
      />
      <HelperText
        text={t("Auth.Form.Helpers.AtLeastOneNumber")}
        isSubmitted={isSubmitted}
        errorExist={!!error?.includes(PASSWORD_SCHEMA_ERRORS.NUMBER_MISSING)}
      />
      <HelperText
        text={t("Auth.Form.Helpers.UpperLowerCase")}
        isSubmitted={isSubmitted}
        errorExist={UPPER_LOWER_CASE_CHECK.some(field => error?.includes(field))}
      />
      <HelperText
        text={t("Auth.Form.Helpers.SpecialCharacterMissing")}
        isSubmitted={isSubmitted}
        errorExist={!!error?.includes(PASSWORD_SCHEMA_ERRORS.SPECIAL_CHARACTER)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: MARGIN_TOP },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
  },
})
