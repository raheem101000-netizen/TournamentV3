import { useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import { DirectEventHandler } from "react-native/Libraries/Types/CodegenTypes"
import PagerView from "react-native-pager-view"
import { OnPageSelectedEventData } from "react-native-pager-view/lib/typescript/PagerViewNativeComponent"

import { PagerHeader } from "./components"
import { SCREENS } from "./constants"
import { HostedScreen, JoinedScreen } from "./screens"

export const OrganiserBody = () => {
  const ref = useRef<PagerView>(null)
  const [selectedScreen, setSelectedScreen] = useState(SCREENS.HOSTED_SCREEN)

  const onChange: DirectEventHandler<OnPageSelectedEventData> = ({ nativeEvent }) => {
    setSelectedScreen(nativeEvent.position)
  }

  return (
    <View style={styles.container}>
      <PagerHeader pagerRef={ref} selectedScreen={selectedScreen} />
      <PagerView
        ref={ref}
        style={styles.pagerView}
        initialPage={SCREENS.HOSTED_SCREEN}
        onPageSelected={onChange}>
        <HostedScreen key={SCREENS.HOSTED_SCREEN} />
        <JoinedScreen key={SCREENS.JOINED_SCREEN} />
      </PagerView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
})
