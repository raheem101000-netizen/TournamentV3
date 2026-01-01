import { useMutation } from "@apollo/client"
import { useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { CustomInput, DoubleButtonModal } from "@/components"
import { DELETE_SERVER, GET_ORGANISATOR_MY_SERVERS, SERVERS_BY_CATEGORY } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { SERVER_FETCH_LIMIT } from "@/utils/constants"

type DeleteServerModalProps = {
  serverInfo: string
  deleteModalVisible: boolean
  serverName: string | undefined
  setDeleteModalVisible: (value: boolean) => void
}

export const DeleteServerModal = ({
  deleteModalVisible,
  serverInfo,
  serverName,
  setDeleteModalVisible,
}: DeleteServerModalProps) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { back } = useRouter()

  const [deleteServer, { loading: loadingDeleteServer }] = useMutation(DELETE_SERVER, {
    client,
  })
  const [textToDelete, setTextToDelete] = useState("")

  const closeDeleteModal = () => setDeleteModalVisible(false)

  const onConfirmDeleteServer = () => {
    deleteServer({
      variables: {
        serverId: serverInfo,
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: SERVERS_BY_CATEGORY,
          variables: {
            filter: {
              pageInput: {
                limit: SERVER_FETCH_LIMIT,
                start: 0,
              },
            },
          },
        },
        {
          query: GET_ORGANISATOR_MY_SERVERS,
          variables: {
            filter: {
              pageInput: {
                limit: SERVER_FETCH_LIMIT,
                start: 0,
              },
            },
          },
        },
      ],
      onCompleted: ({ users }) => {
        if (users?.user?.organisator?.serverOps?.delete) {
          back()
          closeDeleteModal()
          showToast({ message: t("Toast.Success.ServerDeleted") })
        }
      },
    })
  }

  return (
    <DoubleButtonModal
      visible={deleteModalVisible}
      title={t("ServerInfo.DeleteModal.Title")}
      description={`${t("ServerInfo.DeleteModal.Description")}\n\n${t(
        "ServerInfo.DeleteModal.AdditionalDescription",
      )}`}
      confirmButtonTitle={t("ServerInfo.DeleteModal.ButtonTitle")}
      closeModal={closeDeleteModal}
      onConfirmButtonPress={onConfirmDeleteServer}
      confirmButtonDisabled={serverName !== textToDelete}
      subDescription={serverName ? `\n${serverName}` : undefined}
      confirmButtonLoading={loadingDeleteServer}>
      <CustomInput autoCapitalize="none" value={textToDelete} onChangeText={setTextToDelete} />
    </DoubleButtonModal>
  )
}
