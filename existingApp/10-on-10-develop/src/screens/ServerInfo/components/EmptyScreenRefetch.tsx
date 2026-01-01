import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { CustomButton, EmptyScreen } from "@/components"
import { DEFAULT_PADDING_HORIZONTAL } from "@/utils/constants"

interface IEmptyScreenRefetch {
  refetch: () => void
}

export const EmptyScreenRefetch = ({ refetch }: IEmptyScreenRefetch) => {
  const { t } = useTranslation()

  return (
    <View style={styles.emptyScreenWrapper}>
      <EmptyScreen
        title={t("ServerInfo.EmptyScreen.FetchFailed.Title")}
        description={t("ServerInfo.EmptyScreen.FetchFailed.Description")}>
        <CustomButton
          buttonTitle={t("ServerInfo.EmptyScreen.FetchFailed.Button")}
          onPress={refetch}
        />
      </EmptyScreen>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyScreenWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
})
