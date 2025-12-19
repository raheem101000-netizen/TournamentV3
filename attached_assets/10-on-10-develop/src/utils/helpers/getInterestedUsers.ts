import { ServerByIdProps } from "@/gql"
import i18n from "@/translations/i18n"

interface IGetInterestedUsersText {
  interestedUsers: ServerByIdProps["interestedUsers"]
}

export const getInterestedUsersText = ({ interestedUsers }: IGetInterestedUsersText) => {
  if (!interestedUsers) return i18n.t("HomeScreen.ServerCards.ServerCard.NoOnePlayer")
  if (interestedUsers.length === 1) {
    return i18n.t("HomeScreen.ServerCards.ServerCard.OnePlayer")
  } else if (interestedUsers.length > 1) {
    return `${interestedUsers.length} ${i18n.t("HomeScreen.ServerCards.ServerCard.MorePlayers")}`
  }
  return i18n.t("HomeScreen.ServerCards.ServerCard.NoOnePlayer")
}
