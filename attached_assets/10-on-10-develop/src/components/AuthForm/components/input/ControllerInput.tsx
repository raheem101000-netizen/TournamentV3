import { useState } from "react"
import { useController } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { TextInputProps, View } from "react-native"

import { CustomInput, CustomInputProps } from "@/components/CustomInput"

import { ControllerMainProps, FormDataType, SchemaName } from "../../types"
import { InputHelpers } from "./InputHelpers"

export const ControllerInput = <T extends SchemaName>({
  schema,
  fieldName,
}: ControllerMainProps<T>) => {
  const { t } = useTranslation()
  const {
    field: { name, onChange, value },
    fieldState: { error },
  } = useController<FormDataType<typeof schema>>({ name: fieldName })

  const [secureText, setSecureText] = useState(false)

  const textContentType = (): TextInputProps["textContentType"] => {
    switch (schema) {
      case "createAccountSchema":
        switch (fieldName) {
          case "email":
            return "username"
          case "password":
            return "newPassword"
        }
        break
      case "loginSchema":
        switch (fieldName) {
          case "email":
            return "username"
          case "password":
            return "password"
        }
        break
      default:
        return "none"
    }
  }

  const secureIconPress = () => setSecureText(prevIconState => !prevIconState)

  const additionalProps = (): CustomInputProps | undefined => {
    switch (fieldName) {
      case "password":
      case "newPassword": {
        return {
          secureTextEntry: secureText,
          rightIcon: {
            icon: secureText ? "EyeOff" : "Eye",
            onIconPress: secureIconPress,
          },
        }
      }
      default:
    }
  }

  return (
    <View>
      <CustomInput
        placeholder={t(`Auth.Form.Placeholder.${name}`)}
        value={value}
        error={!!error}
        autoCapitalize="none"
        keyboardType="ascii-capable"
        onChangeText={onChange}
        textContentType={textContentType()}
        {...additionalProps()}
      />
      <InputHelpers fieldName={fieldName} schema={schema} />
    </View>
  )
}
