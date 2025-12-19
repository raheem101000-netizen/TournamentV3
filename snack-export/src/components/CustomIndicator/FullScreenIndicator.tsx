import { StyleSheet, View } from "react-native"

import { CustomIndicator } from "./CustomIndicator"
import { ICustomIndicator } from "./types"

export const FullScreenIndicator = (props: ICustomIndicator) => {
  return (
    <View style={styles.container}>
      <CustomIndicator {...props} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
