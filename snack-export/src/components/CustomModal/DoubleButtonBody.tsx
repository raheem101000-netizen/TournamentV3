import { PropsWithChildren, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
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

import { CustomAwareView } from "../CustomAwareView"
import { CustomButton, CustomButtonVariants, CustomButtonVersions } from "../CustomButton"
import { DoubleButtonModalBodyProps } from "./types"

type ModalBody = DoubleButtonModalBodyProps & PropsWithChildren

const ANIMATION_DURATION = 400

export const DoubleButtonBody = ({
  visible,
  children,
  confirmButtonTitle,
  confirmButtonDisabled,
  confirmButtonLoading,
  onConfirmButtonPress,
  closeModal,
}: ModalBody) => {
  const { t } = useTranslation()
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
          <CustomAwareView removePaddingHorizontal>
            <Pressable style={[styles.modalBodyContainer, initModalBodyStyle]}>
              <>
                {children}
                <View style={styles.buttonsContainer}>
                  <View style={styles.buttonWrapper}>
                    <CustomButton
                      buttonTitle={t("Common.Cancel")}
                      variant={CustomButtonVariants.SECONDARY}
                      onPress={closeModal}
                    />
                  </View>
                  <View style={styles.buttonWrapper}>
                    <CustomButton
                      buttonTitle={confirmButtonTitle}
                      disabled={confirmButtonDisabled}
                      loading={confirmButtonLoading}
                      variant={CustomButtonVariants.SECONDARY}
                      version={CustomButtonVersions.DANGER}
                      onPress={onConfirmButtonPress}
                    />
                  </View>
                </View>
              </>
            </Pressable>
          </CustomAwareView>
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
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 8,
    gap: 8,
  },
  buttonWrapper: { flex: 1 },
})
