import { TextStyle } from "react-native"

import { AvailableFonts } from "@/assets/fonts"

type SelectedTextStyle = Pick<TextStyle, "fontFamily" | "fontSize" | "textTransform">

type CustomTextHelper = Record<keyof typeof CustomTextVariants, SelectedTextStyle>

export enum CustomTextVariants {
  TITLE_PAGE,
  HEADING,
  SUBHEADING,
  BODY_BASE,
  BODY_STRONG,
  BODY_EMPHASIS,
  BODY_LINK,
  BODY_SMALL,
  BODY_SMALL_STRONG,
  BODY_XS,
  BODY_XS_STRONG,
  SINGLE_LINE_SMALL,
  SINGLE_LINE_SMALL_UPC,
  SINGLE_LINE_XS_STRONG,
  SINGLE_LINE_XS_STRONG_UPC,
  TEST,
}

export const defaultFontStyle: CustomTextHelper = {
  TITLE_PAGE: {
    fontFamily: AvailableFonts.MEDIUM,
    fontSize: 32,
  },
  HEADING: {
    fontFamily: AvailableFonts.MEDIUM,
    fontSize: 24,
  },
  SUBHEADING: {
    fontFamily: AvailableFonts.MEDIUM,
    fontSize: 18,
  },
  TEST: {
    fontFamily: AvailableFonts.BOLD,
    fontSize: 18,
  },
  BODY_BASE: {
    fontFamily: AvailableFonts.REGULAR,
    fontSize: 15,
  },
  BODY_STRONG: {
    fontFamily: AvailableFonts.BOLD,
    fontSize: 15,
  },
  BODY_EMPHASIS: {
    fontFamily: AvailableFonts.ITALIC,
    fontSize: 15,
  },
  BODY_LINK: {
    fontFamily: AvailableFonts.REGULAR,
    fontSize: 15,
  },
  BODY_SMALL: {
    fontFamily: AvailableFonts.MEDIUM,
    fontSize: 13,
  },
  BODY_SMALL_STRONG: {
    fontFamily: AvailableFonts.BOLD,
    fontSize: 13,
  },
  BODY_XS: {
    fontFamily: AvailableFonts.MEDIUM,
    fontSize: 12,
  },
  BODY_XS_STRONG: {
    fontFamily: AvailableFonts.EXTRA_BOLD,
    fontSize: 12,
  },
  SINGLE_LINE_SMALL: {
    fontFamily: AvailableFonts.SEMI_BOLD,
    fontSize: 13,
  },
  SINGLE_LINE_SMALL_UPC: {
    fontFamily: AvailableFonts.BOLD,
    fontSize: 13,
    textTransform: "uppercase",
  },
  SINGLE_LINE_XS_STRONG: {
    fontFamily: AvailableFonts.EXTRA_BOLD,
    fontSize: 12,
  },
  SINGLE_LINE_XS_STRONG_UPC: {
    fontFamily: AvailableFonts.EXTRA_BOLD,
    fontSize: 12,
    textTransform: "uppercase",
  },
}
