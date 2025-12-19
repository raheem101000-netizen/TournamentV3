import { ControllerProps } from "react-hook-form"
import { StyleSheet, View } from "react-native"

import * as Schemas from "@/utils/helpers/schema"

import { FormDataType, FormSchemaProps, SchemaName } from "../types"
import { ControllerInput } from "./input/ControllerInput"

const GAP = 16

export const Controllers = <T extends SchemaName>({ schema }: FormSchemaProps<T>) => {
  return (
    <View style={styles.container}>
      {Object.keys(Schemas[schema]["shape"]).map(_fieldName => {
        const fieldName = _fieldName as ControllerProps<FormDataType<T>>["name"]
        return <ControllerInput key={fieldName} schema={schema} fieldName={fieldName} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: GAP },
})
