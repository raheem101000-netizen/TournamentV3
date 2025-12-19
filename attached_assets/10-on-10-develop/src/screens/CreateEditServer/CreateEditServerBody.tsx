import { useMutation, useQuery } from "@apollo/client"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { FullScreenIndicator } from "@/components"
import {
  CREATE_SERVER,
  GET_ORGANISATOR_MY_SERVERS,
  GET_SERVER_BY_ID,
  SERVERS_BY_CATEGORY,
  UPDATE_SERVER,
} from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { useToast } from "@/providers/ToastProvider"
import { SERVER_FETCH_LIMIT } from "@/utils/constants"
import { CREATE_EDIT_PARAM } from "@/utils/constants/Screens/CreateEditServerParams"

import { CreateEditServerForm, ServerFromData } from "./components"
import { MainCreateEditProps } from "./types"

export const CreateEditServerBody = ({ serverInfo }: MainCreateEditProps) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { back, replace } = useRouter()

  const [defaultValues, setDefaultValues] = useState<ServerFromData>()

  const [createServer, { loading: loadingCreateServer }] = useMutation(CREATE_SERVER, {
    client,
  })

  const [updateServer, { loading: loadingUpdateServer }] = useMutation(UPDATE_SERVER, {
    client,
  })

  const { data, loading: loadingGetServer } = useQuery(GET_SERVER_BY_ID, {
    client,
    skip: serverInfo === CREATE_EDIT_PARAM.CREATE,
    variables: {
      serverId: serverInfo,
    },
  })

  const handleSubmit = ({ category, serverDescription, serverTitle }: ServerFromData) => {
    if (serverInfo === CREATE_EDIT_PARAM.CREATE) {
      return createServer({
        variables: {
          server: {
            title: serverTitle,
            description: serverDescription,
            category: category.slug,
          },
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
          if (users?.user?.organisator?.createServer) {
            showToast({ message: t("Toast.Success.SeverCreated") })
            replace({
              pathname: "/main/[serverInfo]/ServerInfo",
              params: {
                serverInfo: users?.user?.organisator?.createServer,
              },
            })
          }
        },
      })
    }
    updateServer({
      awaitRefetchQueries: true,
      variables: {
        serverId: serverInfo,
        updateServer: {
          title: serverTitle,
          description: serverDescription,
          category: category.slug,
        },
      },
      refetchQueries: [
        {
          query: GET_SERVER_BY_ID,
          variables: {
            serverId: serverInfo,
          },
        },
      ],
      onCompleted: ({ users }) => {
        if (users?.user?.organisator?.serverOps?.update) {
          showToast({ message: t("Toast.Success.ServerUpdate") })
          back()
        }
      },
    })
  }

  useEffect(() => {
    if (loadingGetServer) return
    const serverById = data?.users?.publicUsers?.guest?.serverById
    if (serverById && serverById.category) {
      const { category, description, title } = serverById
      return setDefaultValues({
        category: {
          slug: category.slug,
          name: category.name ?? "",
        },
        serverDescription: description!,
        serverTitle: title,
      })
    }
    setDefaultValues({
      category: {
        name: "",
        slug: "",
      },
      serverDescription: "",
      serverTitle: "",
    })
  }, [data?.users?.publicUsers?.guest?.serverById, loadingGetServer])

  return (
    <View style={styles.container}>
      {defaultValues ? (
        <CreateEditServerForm
          buttonLoading={loadingCreateServer || loadingUpdateServer}
          loadingGetServer={loadingGetServer}
          defaultValues={defaultValues}
          serverInfo={serverInfo}
          handleSubmit={handleSubmit}
        />
      ) : (
        <FullScreenIndicator />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
