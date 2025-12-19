import { useMutation } from "@apollo/client"
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { RouteParams, useLocalSearchParams } from "expo-router"
import { Dispatch, SetStateAction, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Divider, SheetComponent } from "@/components"
import { CustomAutoScaleSheet } from "@/components/CustomBottomSheet/CustomAutoScaleSheet"
import { BAN_USER, BLOCK_USER, GET_SERVER_BY_ID, UN_BAN_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { ToastType } from "@/utils/constants/Toast"

import { PlayerItemProps } from "./types"

type PlayerSheetProps = {
  serverHost: boolean
  selectedPlayer: PlayerItemProps | undefined
  setSelectedPlayer: Dispatch<SetStateAction<string | undefined>>
}

export const PlayerSheet = ({
  selectedPlayer,
  serverHost,
  setSelectedPlayer,
}: PlayerSheetProps) => {
  const { t } = useTranslation()
  const ref = useRef<BottomSheetModalMethods<PlayerItemProps>>(null)
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()
  const { showToast } = useToast()

  const handleCloseSheet = () => setSelectedPlayer(undefined)

  const [banUser, { loading: loadingBanUser }] = useMutation(BAN_USER, {
    client,
  })
  const [unBanUser, { loading: loadingUnBanUser }] = useMutation(UN_BAN_USER, {
    client,
  })
  const [blockUser, { loading: loadingBlockUser }] = useMutation(BLOCK_USER, {
    client,
  })

  const onBanUnBanPress = () => {
    if (selectedPlayer?.banned) {
      return unBanUser({
        variables: {
          serverId: serverInfo,
          userId: selectedPlayer._id,
        },
        awaitRefetchQueries: true,
        refetchQueries: [
          {
            query: GET_SERVER_BY_ID,
            variables: {
              serverId: serverInfo,
            },
          },
        ],
        onError: () =>
          showToast({ type: ToastType.ERROR, message: t("Toast.Errors.SOMETHING_WENT_WRONG") }),
      })
    }
    banUser({
      variables: {
        serverId: serverInfo,
        userId: selectedPlayer?._id ?? "",
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: GET_SERVER_BY_ID,
          variables: {
            serverId: serverInfo,
          },
        },
      ],
      onError: () =>
        showToast({ type: ToastType.ERROR, message: t("Toast.Errors.SOMETHING_WENT_WRONG") }),
    })
  }

  const handleBlockUser = () => {
    blockUser({
      variables: {
        userId: selectedPlayer?._id ?? "",
        block: !selectedPlayer?.blockedByUser,
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: GET_SERVER_BY_ID,
          variables: {
            serverId: serverInfo,
          },
        },
      ],
      onError: () =>
        showToast({ type: ToastType.ERROR, message: t("Toast.Errors.SOMETHING_WENT_WRONG") }),
    })
  }

  useEffect(() => {
    if (selectedPlayer) {
      ref.current?.present(selectedPlayer)
    }
  }, [selectedPlayer])

  return (
    <CustomAutoScaleSheet ref={ref} onClose={handleCloseSheet}>
      {serverHost ? (
        <>
          <SheetComponent
            title={t(`PlayersList.${selectedPlayer?.banned ? "UnBan" : "Ban"}`).toUpperCase()}
            loading={loadingBanUser || loadingUnBanUser}
            onPress={onBanUnBanPress}
          />
          <Divider />
        </>
      ) : null}
      <SheetComponent
        title={t(
          `PlayersList.${selectedPlayer?.blockedByUser ? "Unblock" : "Block"}`,
        ).toUpperCase()}
        loading={loadingBlockUser}
        onPress={handleBlockUser}
      />
    </CustomAutoScaleSheet>
  )
}
