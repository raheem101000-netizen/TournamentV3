import { useQuery } from "@apollo/client"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  CustomAwareView,
  CustomButton,
  CustomButtonVariants,
  CustomButtonVersions,
  DoubleButtonModal,
  GuestEmptyScreen,
  ScreenView,
} from "@/components"
import { FullScreenIndicator } from "@/components/CustomIndicator/"
import { GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useAuth } from "@/providers/AuthProvider"
import { AccountCategories } from "@/screens/Account"
import { ACCOUNT_CATEGORIES } from "@/screens/Account/constants"

const Account = () => {
  const { t } = useTranslation()
  const { replace } = useRouter()
  const { isLogged } = useAuth()

  const [showLogOutModal, setShowLogOutModal] = useState(false)
  const [asyncStorageClearLoading, setAsyncStorageClearLoading] = useState(false)

  const { data, loading } = useQuery(GET_USER, {
    client,
  })

  const onLogOutPress = () => {
    setShowLogOutModal(true)
  }

  const closeModal = () => setShowLogOutModal(false)

  const onConfirmButtonPress = async () => {
    setAsyncStorageClearLoading(true)
    await AsyncStorage.clear()
    await client.clearStore()
    replace("/")
    setAsyncStorageClearLoading(false)
    closeModal()
  }

  if (!isLogged)
    return (
      <ScreenView>
        <GuestEmptyScreen />
      </ScreenView>
    )

  return (
    <ScreenView removeHorizontalPadding removeTopInset removeBottomInset>
      <CustomAwareView>
        {loading ? (
          <FullScreenIndicator indicatorSize={"large"} />
        ) : (
          <>
            <View style={styles.container}>
              <AccountCategories
                category={ACCOUNT_CATEGORIES.ROLE}
                isOrganisator={!!data?.users?.user?.me?.isOrganisator}
              />
              <AccountCategories
                category={ACCOUNT_CATEGORIES.APP}
                isOrganisator={!!data?.users?.user?.me?.isOrganisator}
                username={data?.users?.user?.me?.username}
              />
              <View style={styles.buttonWrapper}>
                <CustomButton
                  buttonTitle={t("Account.LogOut")}
                  variant={CustomButtonVariants.STAND_ALONE}
                  version={CustomButtonVersions.DANGER}
                  onPress={onLogOutPress}
                />
              </View>
            </View>
            <DoubleButtonModal
              visible={showLogOutModal}
              title={t("Account.LogOutModal.Title")}
              confirmButtonTitle={t("Account.LogOutModal.LogOut")}
              description={t("Account.LogOutModal.Description")}
              confirmButtonDisabled={asyncStorageClearLoading}
              confirmButtonLoading={asyncStorageClearLoading}
              onConfirmButtonPress={onConfirmButtonPress}
              closeModal={closeModal}
            />
          </>
        )}
      </CustomAwareView>
    </ScreenView>
  )
}
const styles = StyleSheet.create({
  indicatorWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    gap: 24,
  },
  buttonWrapper: {
    marginTop: 24,
    alignSelf: "flex-end",
  },
})

export default Account
