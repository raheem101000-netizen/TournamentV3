import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { CustomButton, EmptyScreen, ScreenView } from "@/components"
import { FullScreenIndicator } from "@/components/CustomIndicator/"
import { useInitRedirect } from "@/utils/helpers/hook/useInitRedirect"

const IndexScreen = () => {
  const { t } = useTranslation()
  const { loading, refetch } = useInitRedirect()
  const [firstLoading, setFirstLoading] = useState(true)
  const onPress = () => {
    refetch()
  }

  useEffect(() => {
    if (firstLoading) {
      setFirstLoading(loading)
    }
  }, [firstLoading, loading])

  return (
    <ScreenView>
      {firstLoading ? (
        <FullScreenIndicator />
      ) : (
        <View style={styles.container}>
          <EmptyScreen
            title={t("Common.NoInternetConnectionEmptyState.Title")}
            description={t("Common.NoInternetConnectionEmptyState.Description")}>
            <CustomButton
              buttonTitle={t("Common.NoInternetConnectionEmptyState.ButtonTitle")}
              onPress={onPress}
              loading={loading}
            />
          </EmptyScreen>
        </View>
      )}
    </ScreenView>
  )
}

export default IndexScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
