import { useQuery } from "@apollo/client"
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"

import { FullScreenIndicator } from "@/components/CustomIndicator"
import { GET_USER } from "@/gql"
import { client } from "@/providers/ApolloProvider"
import { defaultFontStyle } from "@/utils/constants"
import { useCalculateSizeRatio, useThemeColor } from "@/utils/hooks"

import { AvatarPicker } from "./components"

const IMAGE_SIZE = 64
const GAP = 8
const PADDING_BOTTOM = 4

export const AccountTabHeader = () => {
  const { colors } = useThemeColor()
  const { diagonalRatio } = useCalculateSizeRatio()

  const { data, loading } = useQuery(GET_USER, {
    client,
  })

  const initContainerStyle: StyleProp<ViewStyle> = {
    height: IMAGE_SIZE * diagonalRatio,
  }

  const textBaseDefault: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }
  const textDefaultSecond: StyleProp<TextStyle> = { color: colors.text.base.secondary }

  return (
    <View style={[styles.container, initContainerStyle]}>
      {loading ? (
        <FullScreenIndicator />
      ) : (
        <>
          <AvatarPicker user={data?.users?.user?.me} />
          <View>
            <Text style={[styles.textBaseDefault, textBaseDefault, defaultFontStyle.BODY_STRONG]}>
              {data?.users?.user?.me?.fullName}
            </Text>
            <Text style={[textDefaultSecond, defaultFontStyle.BODY_SMALL]}>
              {data?.users?.user?.me?.username}
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
  },
  textBaseDefault: { paddingBottom: PADDING_BOTTOM },
})
