import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LayoutChangeEvent, StyleSheet, View } from "react-native"

import { CustomButton, CustomButtonVariants, EmptyScreen, ServersList } from "@/components"
import { useGetOrganisatorServers } from "@/utils/helpers/hook/"

import { ListHeader } from "../components"

const EmptyScreenComponent = () => {
  const { t } = useTranslation()
  const { push } = useRouter()

  const onPress = () => {
    push("/main/CreateServer")
  }

  return (
    <EmptyScreen
      title={t("MyServers.Hosted.EmptyScreen.Title")}
      description={t("MyServers.Hosted.EmptyScreen.Title")}>
      <CustomButton
        variant={CustomButtonVariants.SECONDARY}
        buttonTitle={t("MyServers.Hosted.EmptyScreen.ButtonTitle")}
        onPress={onPress}
      />
    </EmptyScreen>
  )
}

export const HostedScreen = () => {
  const { servers, loadingServers, totalServers, hasNextPage, refetchServers, fetchMoreServers } =
    useGetOrganisatorServers()

  const [listHeight, setListHeight] = useState(0)

  const onLayout = (event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height)
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {totalServers > 1 ? <ListHeader totalServers={totalServers} /> : null}
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
