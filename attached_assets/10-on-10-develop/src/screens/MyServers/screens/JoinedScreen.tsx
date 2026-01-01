import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LayoutChangeEvent, StyleSheet, View } from "react-native"

import { CustomButton, CustomButtonVariants, EmptyScreen, ServersList } from "@/components"
import { useGetMyServers } from "@/utils/helpers/hook/"

const EmptyScreenComponent = () => {
  const { t } = useTranslation()

  const { navigate } = useRouter()

  const onPress = () => {
    navigate("/main/tabs/Home")
  }

  return (
    <EmptyScreen
      title={t("MyServers.Joined.EmptyScreen.Title")}
      description={t("MyServers.Joined.EmptyScreen.Title")}>
      <CustomButton
        variant={CustomButtonVariants.SECONDARY}
        buttonTitle={t("MyServers.Joined.EmptyScreen.ButtonTitle")}
        onPress={onPress}
      />
    </EmptyScreen>
  )
}

export const JoinedScreen = () => {
  const { servers, loadingServers, hasNextPage, refetchServers, fetchMoreServers } =
    useGetMyServers()

  const [listHeight, setListHeight] = useState(0)

  const onLayout = (event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height)
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <ServersList
        data={servers}
        loading={loadingServers}
        hasNextPage={hasNextPage}
        listHeight={listHeight}
        refetch={refetchServers}
        fetchMore={fetchMoreServers}
        EmptyScreenComponent={<EmptyScreenComponent />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
