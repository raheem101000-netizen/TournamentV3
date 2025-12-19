import React, { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { ACCOUNT_CATEGORIES } from "../../constants"

interface ICategory extends PropsWithChildren {
  category: ACCOUNT_CATEGORIES
}

export const Category = ({ category, children }: ICategory) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const initTitleStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }

  return (
    <View style={styles.container}>
      <Text style={[defaultFontStyle.BODY_STRONG, initTitleStyle]}>
        {t(`Account.Categories.${category}`)}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
})
