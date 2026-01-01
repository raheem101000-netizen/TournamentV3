import { IconName } from "@/utils/types/sharedComponents/icons"

export interface IInputIcon {
  rightIcon?: {
    icon: Exclude<IconName, "GoogleIcon">
    onIconPress?: () => void
  }
}
