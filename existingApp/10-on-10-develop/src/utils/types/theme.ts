import { ColorSchemeName } from "react-native"

export type ThemeVariant = NonNullable<ColorSchemeName>

export type ThemeColors = Record<ThemeVariant, ColorsVariant>

export type ColorsVariant = {
  background: {
    base: {
      default: string
      secondary: string
    }
    disabled: string
    accent: {
      default: string
      secondary: string
      tertiary: string
    }
    success: {
      default: string
      secondary: string
    }
    warning: {
      default: string
      secondary: string
    }
    danger: {
      default: string
      secondary: string
    }
    over: {
      default: string
      secondary: string
    }
  }
  icon: {
    base: {
      default: string
      secondary: string
      tertiary: string
    }
    disabled: string
    accent: {
      default: string
      secondary: string
    }
    success: {
      default: string
      secondary: string
    }
    warning: {
      default: string
      secondary: string
    }
    danger: {
      default: string
      secondary: string
    }
  }
  text: {
    base: {
      default: string
      secondary: string
      tertiary: string
    }
    disabled: string
    accent: {
      default: string
      secondary: string
    }
    success: {
      default: string
      secondary: string
    }
    warning: {
      default: string
      secondary: string
    }
    danger: {
      default: string
      secondary: string
    }
  }
  border: {
    base: {
      default: string
      secondary: string
      tertiary: string
    }
    disabled: string
    accent: {
      default: string
      secondary: string
    }
    success: {
      default: string
      secondary: string
    }
    warning: {
      default: string
      secondary: string
    }
    danger: {
      default: string
      secondary: string
    }
  }
  unique: {
    1: string
    2: string
    3: string
    4: string
    5: string
    6: string
    7: string
    8: string
    9: string
    10: string
  }
}
