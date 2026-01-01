import { ControllerProps, DefaultValues } from "react-hook-form"
import { z } from "zod"

import * as Schemas from "@/utils/helpers/schema"

export type SchemaName = keyof typeof Schemas

export type FormDataType<T extends SchemaName> = z.infer<(typeof Schemas)[T]>

export type SubmitForm<T extends SchemaName> = {
  handleSubmit: (fields: FormDataType<T>) => void
}

export type FormSchemaProps<T extends SchemaName> = { schema: T }

export type CustomFormProps<T extends SchemaName> = FormSchemaProps<T> &
  SubmitForm<T> & {
    defaultValues?: DefaultValues<FormDataType<T>>
    confirmButtonTitle: string
    loadingSubmit: boolean
  }

export type ControllerMainProps<T extends SchemaName> = FormSchemaProps<T> & {
  fieldName: ControllerProps<FormDataType<T>>["name"]
}
