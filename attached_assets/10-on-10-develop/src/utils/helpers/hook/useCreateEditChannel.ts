import { useMutation } from "@apollo/client"

import { CREATE_CHANNEL, DELETE_CHANNEL, EDIT_CHANNEL } from "@/gql"
import { client } from "@/providers/ApolloProvider"

export const useCreateEditChannel = () => {
  const [createChannel, { loading: loadingCreate }] = useMutation(CREATE_CHANNEL, {
    client,
  })
  const [editChannel, { loading: loadingEdit }] = useMutation(EDIT_CHANNEL, {
    client,
  })
  const [deleteChannel, { loading: loadingDelete }] = useMutation(DELETE_CHANNEL, {
    client,
  })

  return {
    loading: loadingCreate || loadingEdit,
    loadingDelete,
    createChannel,
    editChannel,
    deleteChannel,
  }
}
