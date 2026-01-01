import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
} from "@gorhom/bottom-sheet"
import { useCallback } from "react"
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { CustomButton, CustomButtonVariants } from "../CustomButton"
import { ICustomBottomSheet } from "./interfaces"

export const CustomBottomSheet = ({
  sheetRef,
  buttonTitle,
  title,
  children,
  titleColor,
  buttonRightIcon,
  titleFont,
  buttonLoading,
  buttonDisabled,
  onPress,
  ...props
}: ICustomBottomSheet) => {
  const { colors } = useThemeColor()

  const renderBackdrop = useCallback(
    (props_: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props_} pressBehavior="close" opacity={0.9} disappearsOnIndex={-1} />
    ),
    [],
  )

  const initTitleStyle: StyleProp<TextStyle> = {
    color: titleColor ? titleColor : colors.text.base.secondary,
    ...(titleFont ?? defaultFontStyle.BODY_BASE),
  }

  return (
    <BottomSheetModal
      index={0}
      ref={sheetRef}
      enableDynamicSizing={false}
      snapPoints={["90%"]}
      handleIndicatorStyle={[
        styles.handleIndicatorStyle,
        { backgroundColor: colors.background.base.secondary },
      ]}
      backgroundStyle={{ backgroundColor: colors.background.base.default }}
      backdropComponent={renderBackdrop}
      {...props}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.base.default,
          },
        ]}>
        <Text style={initTitleStyle}>{title}</Text>
        <CustomButton
          buttonTitle={buttonTitle}
          loading={buttonLoading}
          disabled={buttonDisabled}
          variant={CustomButtonVariants.STAND_ALONE}
          onPress={onPress}
          rightIcon={buttonRightIcon}
        />
      </View>
      {children}
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  handleIndicatorStyle: {
    width: 100,
  },
  header: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
})
