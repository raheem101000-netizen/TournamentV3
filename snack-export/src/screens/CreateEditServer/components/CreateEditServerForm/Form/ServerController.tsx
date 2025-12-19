import { useController } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { CustomInput } from "@/components"

import { ServerFromData } from "../Schema"
import { CategoryChange } from "./CategoryChange"

interface IController {
  fieldName: keyof ServerFromData
}

const categoryTypeGuard = (value: unknown): value is ServerFromData["category"] =>
  typeof value === "object"

export const ServerController = ({ fieldName }: IController) => {
  const { t } = useTranslation()

  const {
    field: { onChange, value, onBlur },
    fieldState: { error },
  } = useController({ name: fieldName })

  switch (fieldName) {
    case "serverTitle":
    case "serverDescription":
      return (
        <CustomInput
          error={!!error}
          value={value}
          required
          textAlignVertical="top"
          multiline={fieldName === "serverDescription"}
          placeholder={t(`CreateEditServer.Form.Inputs.${fieldName}.Placeholder`)}
          labelText={t(`CreateEditServer.Form.Inputs.${fieldName}.Label`)}
          autoCapitalize="none"
          onBlur={onBlur}
          onChangeText={onChange}
        />
      )
    case "category":
      if (!categoryTypeGuard(value)) return
      return (
        <CategoryChange
          value={value}
          error={!!error}
          placeholder={t(`CreateEditServer.Form.Inputs.${fieldName}.Placeholder`)}
          labelText={t(`CreateEditServer.Form.Inputs.${fieldName}.Label`)}
          onBlur={onBlur}
          onChange={onChange}
        />
      )
  }
}
