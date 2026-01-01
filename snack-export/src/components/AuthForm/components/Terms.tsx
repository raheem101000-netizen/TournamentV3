import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, StyleProp, Text, TextStyle } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

export const Terms = () => {
  const { colors } = useThemeColor()
  const { t } = useTranslation()
  const { navigate } = useRouter()

  const initStyles: StyleProp<TextStyle> = {
    color: colors.text.base.tertiary,
  }

  const onPress = () => {
    navigate({ pathname: "/Privacy" })
  }

  return (
    <Pressable onPress={onPress}>
      <Text style={[defaultFontStyle.BODY_LINK, initStyles]}>
        {t("Auth.Terms.Main")}{" "}
        <Text style={{ textDecorationLine: "underline" }}>{t("Auth.Terms.UnderLine")}</Text>
      </Text>
    </Pressable>
  )
}
