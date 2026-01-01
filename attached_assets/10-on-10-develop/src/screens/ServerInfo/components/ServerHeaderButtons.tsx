import { useMutation } from "@apollo/client"
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { t } from "i18next"
import { useRef, useState } from "react"
import { Linking, Pressable, StyleSheet, Text, View } from "react-native"

import { CustomIndicator, DoubleButtonModal, IconPicker, SheetComponent } from "@/components"
import { CustomAutoScaleSheet } from "@/components/CustomBottomSheet/CustomAutoScaleSheet"
import { FOLLOW_SERVER, GET_MY_SERVERS, GET_SERVER_BY_ID } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { defaultFontStyle, SERVER_FETCH_LIMIT } from "@/utils/constants"
import { REPORT_SERVER_EMAIL } from "@/utils/constants/ReportEmail"
import { useThemeColor } from "@/utils/hooks"

type ServerSheetProps = {
  iAmInterested: boolean
  serverInfo: string
  loading: boolean
}

export const ServerHeaderButtons = ({ iAmInterested, loading, serverInfo }: ServerSheetProps) => {
  const ref = useRef<BottomSheetModalMethods>(null)
  const { colors } = useThemeColor()
  const { showToast } = useToast()

  const [follow, { loading: loadingFollow }] = useMutation(FOLLOW_SERVER, {
    client,
  })

  const [showUnFollowModal, setShowUnFollowModal] = useState(false)

  const handleShowSheet = () => {
    ref.current?.present()
  }

  const handleFollowUnFollowServer = (followServer: boolean) => {
    follow({
      variables: {
        serverId: serverInfo,
        follow: followServer,
      },
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: GET_SERVER_BY_ID,
          variables: {
            serverId: serverInfo,
          },
        },
        {
          query: GET_MY_SERVERS,
          variables: {
            pageInput: {
              limit: SERVER_FETCH_LIMIT,
              start: 0,
            },
          },
        },
      ],
      onCompleted: ({ users }) => {
        const serverFollowed = users?.user?.followServer
        if (serverFollowed) {
          showToast({
            message: t(`Toast.Success.${!iAmInterested ? "ServerFollowed" : "ServerUnFollowed"}`),
          })
          setShowUnFollowModal(false)
        }
      },
    })
  }

  const onFollowUnFollowButtonPress = () => {
    if (!iAmInterested) {
      return handleFollowUnFollowServer(!iAmInterested)
    }
    return setShowUnFollowModal(true)
  }

  const closeUnFollowModal = () => setShowUnFollowModal(false)

  const handleReportServer = () => {
    const body = t("Common.ReportServer.Title", {
      serverId: serverInfo,
    })
    const url = `mailto:${REPORT_SERVER_EMAIL}?subject=${encodeURIComponent(
      t("Common.ReportServer.Subject"),
    )}&body=${encodeURIComponent(body)}`
    Linking.openURL(url)
  }

  return (
    <>
      <View style={styles.buttonsContainer}>
        <Pressable
          style={[
            styles.serverStatusButtonWrapper,
            {
              backgroundColor: iAmInterested
                ? colors.icon.danger.default
                : colors.icon.success.default,
            },
          ]}
          onPress={onFollowUnFollowButtonPress}>
          {!loadingFollow ? (
            <Text
              style={[
                defaultFontStyle.BODY_SMALL_STRONG,
                { color: colors.background.accent.tertiary, fontSize: 16 },
              ]}
              adjustsFontSizeToFit>
              {t(`ServerInfo.ChannelsSection.${iAmInterested ? "Leave" : "Join"}`)}
            </Text>
          ) : (
            <CustomIndicator
              indicatorColor={colors.background.accent.tertiary}
              indicatorSize={"small"}
            />
          )}
        </Pressable>
        <Pressable hitSlop={4} onPress={handleShowSheet} disabled={loading}>
          <IconPicker icon={"DotsVertical"} />
        </Pressable>
      </View>
      <CustomAutoScaleSheet ref={ref}>
        <View style={{ gap: 4 }}>
          <SheetComponent title={t("Common.ReportServer.Subject")} onPress={handleReportServer} />
        </View>
      </CustomAutoScaleSheet>
      <DoubleButtonModal
        visible={showUnFollowModal}
        title={t("ServerInfo.UnFollowModal.Title")}
        description={t("ServerInfo.UnFollowModal.Description")}
        confirmButtonTitle={t("ServerInfo.UnFollowModal.ButtonTitle")}
        closeModal={closeUnFollowModal}
        onConfirmButtonPress={() => handleFollowUnFollowServer(false)}
        confirmButtonLoading={loadingFollow}
      />
    </>
  )
}

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  serverStatusButtonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    width: 80,
    height: 24,
  },
})
