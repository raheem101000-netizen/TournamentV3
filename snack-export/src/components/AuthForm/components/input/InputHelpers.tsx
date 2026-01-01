import React from "react"
import { useController } from "react-hook-form"

import { ControllerMainProps, FormDataType, SchemaName } from "../../types"
import { PasswordHelper } from "./PasswordHelper"

export const InputHelpers = ({ schema, fieldName }: ControllerMainProps<SchemaName>) => {
  const {
    fieldState: { error },
    formState: { isSubmitted },
  } = useController<FormDataType<typeof schema>>({ name: fieldName })
  switch (fieldName) {
    case "password":
    case "newPassword":
      switch (schema) {
        case "createAccountSchema":
        case "resetPasswordSchema":
          return <PasswordHelper isSubmitted={isSubmitted} error={error?.message} />
      }
      break
    default:
      return null
  }
}
