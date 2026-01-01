import { useKeyboardHandler } from "react-native-keyboard-controller"
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export const useKeyboardFakeView = () => {
  const { bottom } = useSafeAreaInsets()
  const height = useSharedValue(0)

  useKeyboardHandler(
    {
      onMove: e => {
        "worklet"
        height.value = e.progress > 0.5 ? e.height - bottom : e.height
      },
      onEnd: e => {
        "worklet"

        height.value = e.progress > 0.5 ? e.height - bottom : e.height
      },
    },
    [],
  )

  const fakeView = useAnimatedStyle(
    () => ({
      height: Math.abs(height.value),
    }),
    [],
  )

  return { fakeView }
}
