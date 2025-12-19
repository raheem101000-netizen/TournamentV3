import { useNavigation } from "expo-router"
import { useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { DoubleButtonModal } from "@/components"
import { CREATE_EDIT_PARAM } from "@/utils/constants/Screens/CreateEditServerParams"
import { useExitBackHandler } from "@/utils/helpers/hook"

import { ExitScreenButton } from "./components"
import { MainCreateEditProps } from "./types"

export const ModalAndHeader = ({ serverInfo }: MainCreateEditProps) => {
  const { t } = useTranslation()
  const { goBack, setOptions } = useNavigation()

  const [showExitModal, setShowExitModal] = useState(false)

  const closeModal = () => setShowExitModal(false)
  const showModal = () => setShowExitModal(true)
  const onConfirmButtonPress = () => {
    closeModal()
    goBack()
  }

  useExitBackHandler({
    onBackPress: showModal,
  })

  const onHeaderRightPress = () => {
    if (serverInfo === CREATE_EDIT_PARAM.CREATE) {
      return showModal()
    }
    goBack()
  }

  useLayoutEffect(() => {
    setOptions({
      title: t(`Common.${serverInfo === CREATE_EDIT_PARAM.CREATE ? "CreateServer" : "EditServer"}`),
      headerRight: () => <ExitScreenButton onPress={onHeaderRightPress} />,
    })
  })

  return (
    <DoubleButtonModal
      visible={showExitModal}
      title={t("CreateEditServer.ExitModal.Title")}
      description={t("CreateEditServer.ExitModal.Description")}
      confirmButtonTitle={t("CreateEditServer.ExitModal.ButtonConfirmTitle")}
      onConfirmButtonPress={onConfirmButtonPress}
      closeModal={closeModal}
    />
  )
}
