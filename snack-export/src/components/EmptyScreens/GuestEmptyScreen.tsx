import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { client } from "@/providers/ApolloProvider"

import { CustomButton } from "../CustomButton"
import { EmptyScreen } from "./EmptyScreen"

export const GuestEmptyScreen = () => {
  const { replace } = useRouter()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)

  const onPress = async () => {
    setLoading(true)
    await client.clearStore()
    setLoading(false)
    replace({
      pathname: "/auth/AuthScreen",
    })
  }

  return (
    <View style={styles.container}>
      <EmptyScreen
        title={t("Common.GuestMode.EmptyScreen.Title")}
        description={t("Common.GuestMode.EmptyScreen.Description")}>
        <CustomButton
          buttonTitle={t("Common.GuestMode.EmptyScreen.Button")}
          onPress={onPress}
          loading={loading}
        />
      </EmptyScreen>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
