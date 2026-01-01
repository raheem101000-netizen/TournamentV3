import { useState } from "react"
import { LayoutChangeEvent, StyleSheet, View } from "react-native"

import { ChannelList } from "@/components"

interface IChannelsSections {
  serverHost: boolean
  userBanned?: boolean
}

export const ChannelsSections = ({ serverHost, userBanned }: IChannelsSections) => {
  const [listHeight, setListHeight] = useState(0)

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setListHeight(nativeEvent.layout.height)
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <ChannelList serverHost={serverHost} userBanned={userBanned} listHeight={listHeight} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
