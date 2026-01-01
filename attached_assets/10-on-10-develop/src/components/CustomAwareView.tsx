import { StyleProp, StyleSheet, ViewStyle } from "react-native"
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  DEFAULT_PADDING_BOTTOM,
  DEFAULT_PADDING_HORIZONTAL,
  DEFAULT_PADDING_TOP,
} from "@/utils/constants"

interface ICustomAwareView extends KeyboardAwareScrollViewProps {
  insetTop?: boolean
  insetBottom?: boolean
  removePaddingHorizontal?: boolean
}

export const CustomAwareView = ({
  insetBottom,
  insetTop,
  removePaddingHorizontal,
  children,
  ...props
}: ICustomAwareView) => {
  const { bottom, top } = useSafeAreaInsets()

  const initStyle: StyleProp<ViewStyle> = {
    paddingBottom: insetBottom ? bottom + DEFAULT_PADDING_BOTTOM : DEFAULT_PADDING_BOTTOM,
    paddingTop: insetTop ? top + DEFAULT_PADDING_TOP : DEFAULT_PADDING_TOP,
    paddingHorizontal: removePaddingHorizontal ? 0 : DEFAULT_PADDING_HORIZONTAL,
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[initStyle, styles.container, props.contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={12}
      {...props}>
      {children}
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
})
