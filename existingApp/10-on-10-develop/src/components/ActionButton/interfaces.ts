import { IconName } from "@/utils/types/sharedComponents/icons"

export interface IButtonMain {
  buttonWidth?: number
  buttonHeight?: number
  iconWidth?: number
  iconHeight?: number
  loading?: boolean
  disabled?: boolean
  icon: IconName
  onPress: () => void
}
