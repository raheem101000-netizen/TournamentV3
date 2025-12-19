import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import {
  RouteParams,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"

import { CustomButton, CustomButtonVariants } from "@/components"
import { ServerByIdProps } from "@/gql"
import { useAuth } from "@/providers/AuthProvider"
import { DEFAULT_PADDING, defaultFontStyle } from "@/utils/constants"
import { getInterestedUsersText } from "@/utils/helpers/getInterestedUsers"
import { useThemeColor } from "@/utils/hooks"

interface IServerInfoHeader {
  serverData: ServerByIdProps
}

export const ServerInfoHeader = ({ serverData }: IServerInfoHeader) => {
  const { isLogged } = useAuth()
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()
  const { colors } = useThemeColor()
  const { t } = useTranslation()
  const { setOptions } = useNavigation<NativeStackNavigationProp<ParamListBase>>()
  const { push } = useRouter()

  const { title, description, interestedUsers } = serverData

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.secondary,
  }

  const initTitleStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }

  const initDescriptionStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }

  const initInterestedTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }

  const initInterestedUsersWrapper: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.base.secondary,
  }

  const users = getInterestedUsersText({ interestedUsers })

  const onSeeAllPlayersPress = () => {
    push({
      pathname: "/main/[serverInfo]/PlayersList",
      params: { serverInfo },
    })
  }

  useFocusEffect(() => {
    setOptions({
      title,
    })
  })

  return (
    <View style={[styles.container, initContainerStyle]}>
      {!isLogged ? null : (interestedUsers ?? []).length > 0 ? (
        <View style={styles.interestedContainer}>
          <View style={[styles.interestedUsersWrapper, initInterestedUsersWrapper]}>
            <Text style={[defaultFontStyle.SINGLE_LINE_XS_STRONG_UPC, initInterestedTextStyle]}>
              {users}
            </Text>
          </View>
          <CustomButton
            variant={CustomButtonVariants.STAND_ALONE}
            buttonTitle={t("ServerInfo.InterestedUsers.SeeAllPlayers")}
            onPress={onSeeAllPlayersPress}
          />
        </View>
      ) : null}
      <View style={styles.infoTextsContainer}>
        <Text style={[defaultFontStyle.TITLE_PAGE, initTitleStyle]}>{title}</Text>
        <Text style={[defaultFontStyle.BODY_BASE, initDescriptionStyle]}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 1,
    padding: DEFAULT_PADDING,
    gap: 16,
  },
  infoTextsContainer: {
    gap: 8,
  },
  interestedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  interestedUsersWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
})
