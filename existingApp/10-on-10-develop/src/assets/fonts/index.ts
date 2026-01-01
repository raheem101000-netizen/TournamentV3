import { FontSource } from "expo-font"

export enum AvailableFonts {
  EXTRA_BOLD = "RedHatExtraBold",
  SEMI_BOLD = "RedHatSemiBold",
  BOLD = "RedHatBold",
  MEDIUM = "RedHatMedium",
  REGULAR = "RedHatRegular",
  ITALIC = "RedHatItalic",
}

export const Fonts: Record<AvailableFonts, FontSource> = {
  RedHatExtraBold: require("./RedHatDisplay-ExtraBold.ttf"),
  RedHatSemiBold: require("./RedHatDisplay-SemiBold.ttf"),
  RedHatBold: require("./RedHatDisplay-Bold.ttf"),
  RedHatMedium: require("./RedHatDisplay-Medium.ttf"),
  RedHatRegular: require("./RedHatDisplay-Regular.ttf"),
  RedHatItalic: require("./RedHatDisplay-Italic.ttf"),
}
