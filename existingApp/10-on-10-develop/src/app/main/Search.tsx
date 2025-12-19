import { useQuery } from "@apollo/client"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native"

import { CustomInput, EmptyScreen, IconPicker, ScreenView, ServersList } from "@/components"
import { SERVERS_BY_CATEGORY } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { DEFAULT_PADDING_HORIZONTAL, SERVER_FETCH_LIMIT } from "@/utils/constants"
import { useExitBackHandler } from "@/utils/helpers/hook"

const Search = () => {
  const { canGoBack, back } = useRouter()
  const { t } = useTranslation()

  const [searchValue, setSearchValue] = useState("")
  const [debounceValue, setDebounceValue] = useState("")
  const [listHeight, setListHeight] = useState(0)

  const goBack = canGoBack()

  const onBackPress = useCallback(() => {
    if (goBack) {
      back()
    }
  }, [back, goBack])

  useExitBackHandler({
    onBackPress,
  })

  const { data, loading, fetchMore, refetch } = useQuery(SERVERS_BY_CATEGORY, {
    client,
    variables: {
      filter: {
        search: debounceValue,
        pageInput: {
          limit: SERVER_FETCH_LIMIT,
          start: 0,
        },
      },
    },
  })

  const serversByCategory = data?.users?.publicUsers?.guest?.serversByCategory

  const fetchMoreServer = () => {
    if (!serversByCategory || loading) return
    const { servers, pageInfo } = serversByCategory
    if (pageInfo?.hasNext) {
      fetchMore({
        variables: {
          filter: {
            search: debounceValue,
            pageInput: {
              limit: SERVER_FETCH_LIMIT,
              start: servers.length,
            },
          },
        },
      })
    }
  }

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setListHeight(nativeEvent.layout.height)
  }

  const onChangeText = useCallback((text: string) => setSearchValue(text), [])

  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      setDebounceValue(searchValue)
    }, 300)
    return () => clearTimeout(searchDebounce)
  }, [searchValue])

  return (
    <ScreenView removeHorizontalPadding>
      <View style={styles.backAndInputContainer}>
        <Pressable hitSlop={4} onPress={back}>
          <IconPicker icon="ChevronLeft" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <CustomInput
            autoCapitalize="none"
            value={searchValue}
            rightIcon={{
              icon: "Search",
            }}
            onChangeText={onChangeText}
          />
        </View>
      </View>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <ServersList
          data={serversByCategory?.servers ?? []}
          loading={loading}
          listHeight={listHeight}
          hasNextPage={!!serversByCategory?.pageInfo?.hasNext}
          EmptyScreenComponent={
            <EmptyScreen
              title={t("Search.EmptyScreen.Title")}
              description={t("Search.EmptyScreen.Description")}></EmptyScreen>
          }
          fetchMore={fetchMoreServer}
          refetch={refetch}
        />
      </View>
    </ScreenView>
  )
}
export default Search

const styles = StyleSheet.create({
  backAndInputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    marginBottom: 16,
  },
})
