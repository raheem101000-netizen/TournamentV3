import { StyleSheet, View } from "react-native"

import { ServerFromData, serverSchema } from "../Schema"
import { ServerController } from "./ServerController"

export const ServerControllers = () => {
  return (
    <View style={styles.container}>
      {Object.keys(serverSchema.shape).map(field => {
        const fieldName = field as keyof ServerFromData
        return <ServerController key={fieldName} fieldName={fieldName} />
      })}
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
})
