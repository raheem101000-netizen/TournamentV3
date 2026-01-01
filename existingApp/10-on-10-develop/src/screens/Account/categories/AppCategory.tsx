import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Linking } from "react-native"

import { DELETE_ACCOUNT_EMAIL } from "@/utils/constants/ReportEmail"

import { CategoryProps } from "../types"
import { Category, CategoryItem } from "./components"

export const AppCategory = ({ category, username }: Omit<CategoryProps, "isOrganisator">) => {
  const { t } = useTranslation()

  const { navigate } = useRouter()
  const onPress = () =>
    navigate({
      pathname: "/Privacy",
    })

  const handleDeleteAccount = () => {
    const body = t("Account.DeleteEmail.Title", { username })
    const url = `mailto:${DELETE_ACCOUNT_EMAIL}?subject=${encodeURIComponent(
      t("Account.DeleteEmail.Title"),
    )}&body=${encodeURIComponent(body)}`
    Linking.openURL(url)
  }

  return (
    <Category category={category}>
      <CategoryItem
        leftComponent={t("Account.App.PrivacyPolicy")}
        rightComponentText={t("Account.App.Read")}
        rightComponentPress={onPress}
      />
      <CategoryItem
        leftComponent={t("Account.App.Delete")}
        rightComponentText={t("Account.App.DeleteButton")}
        rightComponentPress={handleDeleteAccount}
      />
    </Category>
  )
}
