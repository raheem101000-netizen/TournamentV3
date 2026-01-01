import { FormProvider } from "react-hook-form"
import { StyleSheet, View } from "react-native"

import { CustomAwareView } from "@/components/CustomAwareView"

import { Controllers } from "./components"
import { ChannelFormProps } from "./types"

export const ChannelForm = ({ methods }: ChannelFormProps) => {
  return (
    <FormProvider {...methods}>
      <CustomAwareView insetBottom contentContainerStyle={styles.customAwareView}>
        <View style={styles.container}>
          <Controllers methods={methods} />
        </View>
      </CustomAwareView>
    </FormProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
  },
  customAwareView: {
    paddingTop: 0,
  },
})
