import { useQuery } from "@apollo/client"
import { addMinutes, isWithinInterval } from "date-fns"
import { RouteParams, useLocalSearchParams } from "expo-router"
import { useCallback, useMemo } from "react"

import { GET_CHANNEL_MESSAGES } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { MESSAGE_FETCH_LIMIT } from "@/utils/constants"
import { MessageSortFields, SortDirection } from "@/zeus"

import { ChannelMessageGroup, FlashListSections } from "../types"

export const useChannelMessage = () => {
  const { channel } = useLocalSearchParams<RouteParams<"/main/[serverInfo]/[channel]">>()

  const { data, loading, refetch, fetchMore } = useQuery(GET_CHANNEL_MESSAGES, {
    client,
    variables: {
      channelId: channel,
      messageInput: {
        limit: MESSAGE_FETCH_LIMIT,
        start: 0,
      },
      sortBy: {
        field: MessageSortFields.CREATED_AT,
        direction: SortDirection.DESC,
      },
    },
  })

  const messagesResponse = data?.users?.user?.channelById?.messages
  const fetchMoreMessage = useCallback(async () => {
    if (!messagesResponse || !messagesResponse.pageInfo?.hasNext || loading) return
    await fetchMore({
      variables: {
        messageInput: {
          limit: MESSAGE_FETCH_LIMIT,
          start: messagesResponse.messages.length,
        },
        sortBy: {
          field: MessageSortFields.CREATED_AT,
          direction: SortDirection.DESC,
        },
        channelId: channel,
      },
      updateQuery: (prevResult, { fetchMoreResult }) => {
        const moreMessages = fetchMoreResult.users?.user?.channelById?.messages
        if (!moreMessages) return prevResult
        return {
          ...prevResult,
          users: {
            ...prevResult.users,
            user: {
              ...prevResult.users?.user,
              channelById: {
                messages: {
                  messages: [
                    ...(prevResult.users?.user?.channelById?.messages?.messages ?? []),
                    ...(moreMessages.messages ?? []),
                  ],
                  pageInfo: moreMessages.pageInfo,
                },
              },
            },
          },
        }
      },
    })
  }, [channel, messagesResponse, loading, fetchMore])

  const channelMessageGroup = useMemo((): FlashListSections[] => {
    let channelMessage = messagesResponse?.messages
    if (!channelMessage) return []

    channelMessage = [...channelMessage].reverse()

    const groupedMessages = channelMessage.reduce<ChannelMessageGroup>((groups, message) => {
      const dateString = new Date(message.createdAt).toISOString()
      const lastGroup = groups[groups.length - 1]

      if (
        lastGroup &&
        isWithinInterval(new Date(dateString), {
          start: new Date(lastGroup.date),
          end: addMinutes(new Date(lastGroup.date), 30),
        })
      ) {
        const lastMessage = lastGroup.messagesByDate.at(-1)
        lastGroup.messagesByDate.push({
          ...message,
          sameUser: lastMessage?.user._id === message.user._id,
        })
      } else {
        groups.push({
          date: dateString,
          messagesByDate: [{ ...message, sameUser: false }],
        })
      }

      return groups
    }, [])

    const messageArray = groupedMessages.flatMap(group => [group.date, ...group.messagesByDate])

    return messageArray.reverse()
  }, [messagesResponse])

  return {
    channelMessageGroup,
    loading,
    hasNextPage: !!messagesResponse?.pageInfo?.hasNext,
    refetch,
    fetchMoreMessage,
  }
}
