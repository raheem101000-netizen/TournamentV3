import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { forwardRef, PropsWithChildren, useCallback } from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { DEFAULT_PADDING_BOTTOM, DEFAULT_PADDING_HORIZONTAL } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

type CustomAutoScaleSheetProps = PropsWithChildren & {
  onClose?: () => void
}

export const CustomAutoScaleSheet = forwardRef<BottomSheetModalMethods, CustomAutoScaleSheetProps>(
  ({ children, onClose }, ref) => {
    const { bottom } = useSafeAreaInsets()
    const { colors } = useThemeColor()

    const renderBackdrop = useCallback(
      (props_: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props_}
          pressBehavior="close"
          opacity={0.9}
          disappearsOnIndex={-1}
          onPress={onClose}
        />
      ),
      [onClose],
    )

    return (
      <BottomSheetModal
        ref={ref}
        handleIndicatorStyle={[
          styles.handleIndicatorStyle,
          { backgroundColor: colors.background.base.secondary },
        ]}
        backgroundStyle={{ backgroundColor: colors.background.base.default }}
        backdropComponent={renderBackdrop}>
        <BottomSheetView>
          <View style={[styles.container, { paddingBottom: bottom + DEFAULT_PADDING_BOTTOM }]}>
            {children}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

CustomAutoScaleSheet.displayName = "CustomAutoScaleSheet"

const styles = StyleSheet.create({
  handleIndicatorStyle: {
    width: 100,
  },
  container: {
    paddingTop: 8,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  },
})
