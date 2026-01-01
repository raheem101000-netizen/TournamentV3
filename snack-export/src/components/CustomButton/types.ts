import { PressableProps } from "react-native"

import { IconName } from "@/utils/types/sharedComponents/icons"

import { CustomButtonVariants, CustomButtonVersions } from "./constants"

type CustomButtonVariantChecker<T> = T extends CustomButtonVariants.MAIN
  ? {
      variant?: CustomButtonVariants.MAIN
    }
  : T extends CustomButtonVariants.SECONDARY
    ? {
        variant?: CustomButtonVariants.SECONDARY
        version?: CustomButtonVersions
      }
    : T extends CustomButtonVariants.STAND_ALONE
      ? {
          variant?: CustomButtonVariants.STAND_ALONE
          version?: CustomButtonVersions
        }
      : never

interface CustomButtonMainProps {
  disabled?: boolean
  leftIcon?: IconName
  rightIcon?: IconName
  buttonTitle?: string
  loading?: boolean
}

export type CustomButtonProps<T extends CustomButtonVariants> = CustomButtonVariantChecker<T> &
  CustomButtonMainProps &
  Omit<PressableProps, "style">

export interface ICustomButtonBody extends CustomButtonMainProps {
  componentsColor?: string
}
