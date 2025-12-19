import { PropsWithChildren, useEffect, useState } from "react"
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from "react-native"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { DEFAULT_PADDING, DEFAULT_PADDING_HORIZONTAL } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

interface ICustomModal extends PropsWithChildren {
  visible: boolean
  closeModal: () => void
}

const ANIMATION_DURATION = 400

export const CustomModalBody = ({ visible, children, closeModal }: ICustomModal) => {
  const { colors } = useThemeColor()
  const { height } = useWindowDimensions()

  const [isVisible, setIsVisible] = useState(false)

  const position = useSharedValue(height)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value }],
  }))

  const initBackdropStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.over.default,
  }
  const initModalBodyStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.tertiary,
  }
  useEffect(() => {
    if (visible) {
      setIsVisible(visible)
      position.value = withTiming(0, { duration: ANIMATION_DURATION })
    } else {
      position.value = withTiming(
        height,
        { duration: ANIMATION_DURATION },
        finished => finished && runOnJS(setIsVisible)(false),
      )
    }
  }, [height, position, visible])

  return (
    //INFO: The second Pressable is used to prevent the ‘closeModal’ function from being called.
    <Modal visible={isVisible} transparent>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.container, initBackdropStyle]}
        onPress={closeModal}>
        <Animated.View style={animatedStyle}>
          <Pressable style={[styles.modalBodyContainer, initModalBodyStyle]}>{children}</Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    zIndex: 1,
  },
  modalBodyContainer: {
    padding: DEFAULT_PADDING,
    borderRadius: 8,
    width: "100%",
    gap: 16,
    zIndex: 2,
  },
})
