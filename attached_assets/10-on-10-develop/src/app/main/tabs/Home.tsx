import { useQuery } from "@apollo/client"
import { useRouter } from "expo-router"
import { useMemo } from "react"
import { StyleSheet, View } from "react-native"

import { AddNewServerButton, CustomInput, ScreenView } from "@/components"
import { FullScreenIndicator } from "@/components/CustomIndicator/"
import { GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { ServersSection } from "@/screens/Home/"

const Home = () => {
  const { push } = useRouter()
  const { data, loading } = useQuery(GET_USER, {
    client,
  })

  const isOrganisator = useMemo(() => {
    return !!data?.users?.user?.me?.isOrganisator
  }, [data])

  const navigateToSearchScreen = () => push("/main/Search")

  return (
    <>
      <ScreenView removeTopInset removeBottomInset removeHorizontalPadding>
        {loading ? (
          <FullScreenIndicator />
        ) : (
          <View style={styles.container}>
            <View style={styles.inputWrapper}>
              <CustomInput
                rightIcon={{ icon: "Search" }}
                placeholder="Search"
                editable={false}
                disableLabel
                onPress={navigateToSearchScreen}
              />
            </View>
            <ServersSection isOrganisator={isOrganisator} />
            <AddNewServerButton isOrganisator={isOrganisator} />
          </View>
        )}
      </ScreenView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputWrapper: {
    paddingHorizontal: 16,
  },
})

export default Home
