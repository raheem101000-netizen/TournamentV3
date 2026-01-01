import { NativeStackHeaderProps } from "@react-navigation/native-stack"
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { DEFAULT_PADDING_HORIZONTAL, defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"
import { IconName } from "@/utils/types/sharedComponents/icons"

import { IconPicker } from "../IconPicker"

const HEADER_HEIGHT = 56

interface INavigationHeader extends NativeStackHeaderProps {
  backIcon?: IconName
}

export const SubScreenHeader = ({ navigation, options, backIcon }: INavigationHeader) => {
  const { top } = useSafeAreaInsets()
  const { colors } = useThemeColor()

  const headerInitStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.secondary,
    height: top + HEADER_HEIGHT,
  }

  const initTitleStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
    flex: 1,
  }

  return (
    <View style={[headerInitStyle, styles.container]}>
      <View style={styles.contentContainer}>
        <View style={styles.backAndTitleContainer}>
          {backIcon && navigation.canGoBack() ? (
            <Pressable hitSlop={4} onPress={navigation.goBack}>
              <IconPicker icon={backIcon} style={initTitleStyle} />
            </Pressable>
          ) : null}
          <Text style={[initTitleStyle, defaultFontStyle.SUBHEADING]} numberOfLines={1}>
            {options.title}
          </Text>
        </View>
        {options.headerRight ? options.headerRight({ canGoBack: true }) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { justifyContent: "flex-end", paddingBottom: 16 },
  backAndTitleContainer: {
    flexGrow: 1,
    paddingLeft: DEFAULT_PADDING_HORIZONTAL,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contentContainer: {
    paddingRight: DEFAULT_PADDING_HORIZONTAL,
    flexDirection: "row",
  },
})
