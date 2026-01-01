import { useEffect, useState } from "react"
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from "react-native"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconPicker } from "@/components/IconPicker"
import { defaultFontStyle } from "@/utils/constants"
import { ToastType } from "@/utils/constants/Toast"
import { useThemeColor } from "@/utils/hooks"
import { DisplayedToast } from "@/utils/types/providers/toast"

interface IToast extends DisplayedToast {
  deleteToast: (id: number) => void
  toastIdx: number
}
const TOAST_ANIMATION_DURATION = 300
const TOAST_POSITION = 24
const TOAST_OUT_OF_BOX_POSITION = -120
const TIME_TO_DELETE = 2000

export const Toast = ({ id, message, type, toastIdx, deleteToast }: IToast) => {
  const { top } = useSafeAreaInsets()
  const { colors } = useThemeColor()

  const [visible, setVisible] = useState(false)

  const yPosition = useDerivedValue(() =>
    visible ? top + toastIdx * 2.5 * TOAST_POSITION : TOAST_OUT_OF_BOX_POSITION,
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(
            yPosition.value,
            {
              duration: TOAST_ANIMATION_DURATION,
            },
            finished => !visible && finished && runOnJS(deleteToast)(id),
          ),
        },
      ],
    }
  })

  const containerInitStyles: StyleProp<ViewStyle> = {
    backgroundColor:
      type === ToastType.SUCCESS
        ? colors.background.success.default
        : type === ToastType.WARNING
          ? colors.background.warning.default
          : colors.background.danger.default,
  }

  const textInitStyles: StyleProp<TextStyle> = {
    color:
      type === ToastType.SUCCESS
        ? colors.text.success.default
        : type === ToastType.WARNING
          ? colors.text.warning.default
          : colors.text.danger.default,
  }

  const hideToast = () => setVisible(false)

  useEffect(() => {
    setVisible(!!message)
    const timeout = setTimeout(hideToast, TIME_TO_DELETE)
    return () => clearTimeout(timeout)
  }, [message])

  const Icon = () => {
    switch (type) {
      case ToastType.SUCCESS: {
        return <IconPicker icon="Check" iconColor={colors.icon.success.default} />
      }
      case ToastType.WARNING: {
        return (
          <IconPicker icon="CircleAlert" iconColor={colors.icon.warning.default} strokeWidth={2} />
        )
      }
      default: {
        return <IconPicker icon="XMark" iconColor={colors.icon.danger.default} />
      }
    }
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.container,
        { backgroundColor: colors.background.base.default },
      ]}>
      <Pressable style={[styles.contentContainer, containerInitStyles]} onPress={hideToast}>
        <Icon />
        <Text style={[defaultFontStyle.BODY_BASE, textInitStyles]}>{message}</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    height: 36,
  },
})
