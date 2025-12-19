import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { CustomButton, CustomButtonVariants } from "@/components"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

type ListDescriptionProps = {
  description?: string
  open?: boolean
}

export const ListDescription = ({ description, open }: ListDescriptionProps) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const [expandDescription, setExpandDescription] = useState(true)

  const onIconPress = () => {
    setExpandDescription(prevState => !prevState)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.accent.secondary }]}>
      <Text
        style={[
          defaultFontStyle.BODY_BASE,
          styles.descriptionText,
          { color: colors.text.base.default },
        ]}
        numberOfLines={expandDescription ? undefined : 2}>
        {description}
      </Text>
      {open ? (
        <View style={styles.chevronWrapper}>
          <CustomButton
            variant={CustomButtonVariants.STAND_ALONE}
            buttonTitle={t(`Channel.${expandDescription ? "Hide" : "ShowMore"}`)}
            onPress={onIconPress}
          />
        </View>
      ) : null}
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    marginTop: 1,
    padding: 16,
    gap: 12,
  },
  descriptionText: {
    flexGrow: 1,
  },
  chevronWrapper: {
    alignSelf: "flex-end",
  },
})
