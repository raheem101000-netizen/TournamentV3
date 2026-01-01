import { useMutation } from "@apollo/client"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { Divider, DoubleButtonModal, IconPicker } from "@/components"
import { GET_USER, MAKE_ME_OGRANISATOR } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { CategoryProps } from "../types"
import { Category, CategoryItem } from "./components"

interface IOrganiser {
  isOrganisator: boolean
}

const Organiser = ({ isOrganisator }: IOrganiser) => {
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const color = colors.text.accent.secondary

  return (
    <View style={styles.organizerContainer}>
      <IconPicker icon={isOrganisator ? "SquareUserRound" : "Users"} iconColor={color} />
      <Text style={[defaultFontStyle.SINGLE_LINE_SMALL_UPC, { color }]}>
        {t(`Account.Role.${isOrganisator ? "Organizer" : "RegularUser"}`)}
      </Text>
    </View>
  )
}

export const RoleCategory = ({ category, isOrganisator }: CategoryProps) => {
  const { t } = useTranslation()

  const [changeRoleModal, setChangeRoleModal] = useState(false)

  const [makeMeOrganiser, { loading }] = useMutation(MAKE_ME_OGRANISATOR, {
    client,
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_USER,
      },
    ],
    onCompleted: ({ users }) => {
      if (users?.user?.makeMeOrganisator) {
        closeModal()
      }
    },
  })

  const buttonText = !isOrganisator ? t("Account.Role.Change") : undefined

  const showModal = () => {
    setChangeRoleModal(true)
  }

  const closeModal = () => {
    setChangeRoleModal(false)
  }

  const onConfirmButtonPress = () => {
    makeMeOrganiser()
  }

  return (
    <Category category={category}>
      <CategoryItem
        leftComponent={<Organiser isOrganisator={isOrganisator} />}
        rightComponentText={buttonText}
        rightComponentPress={showModal}
      />
      <Divider />
      <DoubleButtonModal
        visible={changeRoleModal}
        title={t("Account.MakeMeOrganizeModal.Title")}
        confirmButtonTitle={t("Account.MakeMeOrganizeModal.Confirm")}
        description={t("Account.MakeMeOrganizeModal.Description")}
        subDescription={t("Account.MakeMeOrganizeModal.SubDescription")}
        confirmButtonDisabled={loading}
        confirmButtonLoading={loading}
        onConfirmButtonPress={onConfirmButtonPress}
        closeModal={closeModal}
      />
    </Category>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  organizerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
})
