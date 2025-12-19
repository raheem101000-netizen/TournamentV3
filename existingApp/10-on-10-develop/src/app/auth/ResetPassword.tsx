import { StyleSheet, View } from "react-native"

import { CustomAwareView, ScreenView } from "@/components"
import { ResetPasswordStage } from "@/screens/ResetPassword"

const GAP = 16

const ResetPassword = () => {
  return (
    <ScreenView removeTopInset removeBottomInset removeHorizontalPadding>
      <CustomAwareView insetBottom>
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <ResetPasswordStage />
          </View>
        </View>
      </CustomAwareView>
    </ScreenView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  contentContainer: {
    gap: GAP,
  },
})

export default ResetPassword
