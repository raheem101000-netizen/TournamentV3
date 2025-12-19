import { BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet"
import { zodResolver } from "@hookform/resolvers/zod"
import { RouteParams, useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CustomButton, CustomButtonVariants, CustomButtonVersions } from "@/components/CustomButton"
import { ChannelProps, GET_CHANNELS_BY_SERVER_ID } from "@/gql"
import { useToast } from "@/providers/ToastProvider"
import {
  DEFAULT_PADDING_BOTTOM,
  DEFAULT_PADDING_HORIZONTAL,
  defaultFontStyle,
} from "@/utils/constants"
import { useCreateEditChannel } from "@/utils/helpers/hook"
import { useThemeColor } from "@/utils/hooks"

import { DoubleButtonModal } from "../../CustomModal"
import { CustomBottomSheet } from "../CustomBottomSheet"
import { ExternalCustomBottomSheet } from "../interfaces"
import { ChannelForm, ChannelFormData } from "./ChannelForm"
import { channelSchema } from "./ChannelForm/ChannelSchema"

export enum ChannelSheetType {
  CREATE = "Create",
  EDIT = "Edit",
}

type ChannelSheetProps = ExternalCustomBottomSheet &
  (
    | {
        type: ChannelSheetType.CREATE
      }
    | {
        type: ChannelSheetType.EDIT
        channelData?: ChannelProps
        resetChannelData: () => void
      }
  )

export const ChannelSheet = ({ sheetRef, ...props }: ChannelSheetProps) => {
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { colors } = useThemeColor()
  const { loading, loadingDelete, createChannel, deleteChannel, editChannel } =
    useCreateEditChannel()
  const { showToast } = useToast()

  const [exitModalVisible, setExitModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const methods = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues:
      props.type === ChannelSheetType.EDIT
        ? {
            name: props.channelData?.name,
            description: props.channelData?.description,
            open: props.channelData?.open,
            tournament: props.channelData?.tournament,
          }
        : {
            description: "",
            name: "",
            open: true,
            tournament: false,
          },
    reValidateMode: "onChange",
    mode: "onBlur",
  })

  const buttonDisabled = useMemo(() => {
    const differentFieldsArray = Object.keys(channelSchema.shape)
      .filter(field => field !== "open")
      .map(field => {
        const fieldName = field as keyof ChannelFormData
        const watchedValue = methods.watch(fieldName)
        return watchedValue !== methods.control._defaultValues
      })

    return Object.keys(methods.formState.errors).length !== 0 ||
      props.type === ChannelSheetType.CREATE
      ? differentFieldsArray.includes(false)
      : !differentFieldsArray.includes(true)
  }, [methods, props.type])

  const handleSubmit = methods.handleSubmit(channelDetails => {
    if (props.type === ChannelSheetType.CREATE) {
      return createChannel({
        variables: {
          serverId: serverInfo,
          channelDetails,
        },
        awaitRefetchQueries: true,
        refetchQueries: [
          {
            query: GET_CHANNELS_BY_SERVER_ID,
            variables: {
              serverId: serverInfo,
            },
          },
        ],
        onCompleted: ({ users }) => {
          const createChannel = users?.user?.organisator?.serverOps?.createChannel
          if (createChannel) {
            sheetRef.current?.close()
            methods.reset()
            showToast({ message: t("Toast.Success.ChannelCreated") })
          }
        },
      })
    }
    editChannel({
      variables: {
        channelDetails,
        channelId: props.channelData?._id ?? "",
        serverId: serverInfo,
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: GET_CHANNELS_BY_SERVER_ID,
          variables: {
            serverId: serverInfo,
          },
        },
      ],
      onCompleted: ({ users }) => {
        const updateChannel = users?.user?.organisator?.serverOps?.channelOps?.update
        if (updateChannel) {
          sheetRef.current?.close()
          methods.reset()
          showToast({ message: t("Toast.Success.ChannelUpdate") })
        }
      },
    })
  })

  const showExitModal = () => setExitModalVisible(true)

  const closeExitModal = () => setExitModalVisible(false)

  const showDeleteModal = () => setDeleteModalVisible(true)

  const closeDeleteModal = () => setDeleteModalVisible(false)

  const onConfirmExitModalButtonPress = () => {
    sheetRef.current?.close()
    closeExitModal()
  }

  const onConfirmDeleteModalButtonPress = () => {
    props.type === ChannelSheetType.EDIT &&
      deleteChannel({
        variables: {
          channelId: props.channelData?._id ?? "",
          serverId: serverInfo,
        },
        refetchQueries: [
          {
            query: GET_CHANNELS_BY_SERVER_ID,
            variables: {
              serverId: serverInfo,
            },
          },
        ],
        awaitRefetchQueries: true,
        onCompleted: ({ users }) => {
          const deleteChannel = users?.user?.organisator?.serverOps?.channelOps?.delete
          if (deleteChannel) {
            sheetRef.current?.close()
            methods.reset()
            closeDeleteModal()
          }
        },
      })
  }

  const onSheetDismiss = () => {
    methods.reset()
    if (props.type === ChannelSheetType.EDIT) {
      props.resetChannelData()
    }
  }

  const renderBackdrop = useCallback(
    (props_: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props_}
        pressBehavior="collapse"
        opacity={0.9}
        disappearsOnIndex={-1}
        onPress={showExitModal}
      />
    ),
    [],
  )

  useEffect(() => {
    if (props.type === ChannelSheetType.EDIT) {
      methods.reset()
    }
  }, [methods, props.type])

  return (
    <>
      <CustomBottomSheet
        title={t(`ServerInfo.BottomSheet.Title.${props.type}`)}
        buttonTitle={t("ServerInfo.BottomSheet.Done")}
        buttonRightIcon="Check"
        titleColor={colors.text.base.default}
        titleFont={defaultFontStyle.SUBHEADING}
        sheetRef={sheetRef}
        buttonDisabled={buttonDisabled}
        buttonLoading={loading}
        onPress={handleSubmit}
        backdropComponent={renderBackdrop}
        onDismiss={onSheetDismiss}>
        <View style={[styles.container, { paddingBottom: bottom + DEFAULT_PADDING_BOTTOM }]}>
          <ChannelForm methods={methods} />
          {props.type === ChannelSheetType.EDIT ? (
            <CustomButton
              buttonTitle={t("ServerInfo.BottomSheet.Delete.ButtonTitle")}
              variant={CustomButtonVariants.SECONDARY}
              version={CustomButtonVersions.DANGER}
              loading={loadingDelete}
              onPress={showDeleteModal}
            />
          ) : null}
        </View>
      </CustomBottomSheet>
      <DoubleButtonModal
        visible={exitModalVisible}
        title={t("ServerInfo.BottomSheet.ExitModal.Title")}
        description={t("ServerInfo.BottomSheet.ExitModal.Description")}
        confirmButtonTitle={t("ServerInfo.BottomSheet.ExitModal.ButtonConfirmTitle")}
        onConfirmButtonPress={onConfirmExitModalButtonPress}
        closeModal={closeExitModal}
      />
      <DoubleButtonModal
        visible={deleteModalVisible}
        title={t("ServerInfo.BottomSheet.Delete.Modal.Title")}
        description={t("ServerInfo.BottomSheet.Delete.Modal.Description")}
        confirmButtonTitle={t("ServerInfo.BottomSheet.Delete.Modal.ButtonConfirmTitle")}
        onConfirmButtonPress={onConfirmDeleteModalButtonPress}
        closeModal={closeDeleteModal}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    justifyContent: "space-between",
  },
})
