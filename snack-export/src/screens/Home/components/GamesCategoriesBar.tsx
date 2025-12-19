import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { CustomButton, CustomButtonVariants } from "@/components"
import { AllCategoriesProps } from "@/gql"
import { DEFAULT_PADDING_HORIZONTAL, defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface IGamesCategoriesBar {
  data: Partial<AllCategoriesProps>[]
  loading: boolean
  onPress: () => void
}

export const GamesCategoriesBar = ({ data, loading, onPress }: IGamesCategoriesBar) => {
  const { colors } = useThemeColor()
  const { t } = useTranslation()

  return (
    <View style={styles.gamesCategoriesBarContainer}>
      <Text style={[defaultFontStyle.SUBHEADING, { color: colors.text.base.secondary }]}>
        {t("HomeScreen.GamesCategoriesBar.SectionTitle")}
      </Text>
      {data.length && !loading ? (
        <CustomButton
          buttonTitle={t("HomeScreen.GamesCategoriesBar.FullList")}
          variant={CustomButtonVariants.STAND_ALONE}
          onPress={onPress}
          loading={loading}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  gamesCategoriesBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
})
