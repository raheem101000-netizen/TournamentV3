import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"

import * as Schemas from "@/utils/helpers/schema"

import { CustomButton } from "../CustomButton"
import { Controllers, Terms } from "./components"
import { CustomFormProps, FormDataType, SchemaName } from "./types"

export const AuthForm = <T extends SchemaName>({
  schema,
  defaultValues,
  confirmButtonTitle,
  loadingSubmit,
  handleSubmit,
}: CustomFormProps<T>) => {
  const methods = useForm<FormDataType<T>>({
    resolver: zodResolver(Schemas[schema]),
    defaultValues,
    reValidateMode: "onChange",
    mode: "onBlur",
  })

  return (
    <FormProvider {...methods}>
      <>
        <Controllers schema={schema} />
        {schema === "createAccountSchema" ? <Terms /> : null}
        <CustomButton
          buttonTitle={confirmButtonTitle}
          onPress={methods.handleSubmit(handleSubmit)}
          disabled={loadingSubmit}
          loading={loadingSubmit}
        />
      </>
    </FormProvider>
  )
}
