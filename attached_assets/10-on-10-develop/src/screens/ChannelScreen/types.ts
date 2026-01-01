import { MessageDetailsSelector } from "@/gql"

export type MessageDetailForUser = MessageDetailsSelector & { sameUser: boolean }

export type FlashListSections = string | MessageDetailForUser

export type ChannelMessageGroup = {
  date: string
  messagesByDate: MessageDetailForUser[]
}[]

export type FocusedItem = {
  item: MessageDetailForUser
}
