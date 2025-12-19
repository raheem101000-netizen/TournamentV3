import { BottomSheetModalProps } from "@gorhom/bottom-sheet"
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { PropsWithChildren, RefObject } from "react"

import { ServerFromData } from "@/screens/CreateEditServer/components"
import { defaultFontStyle } from "@/utils/constants"
import { IconName } from "@/utils/types/sharedComponents/icons"

export interface ExternalCustomBottomSheet {
  sheetRef: RefObject<BottomSheetModalMethods>
}
export interface ICustomBottomSheet
  extends PropsWithChildren,
    Omit<BottomSheetModalProps, "children">,
    ExternalCustomBottomSheet {
  title?: string
  buttonTitle?: string
  buttonLoading?: boolean
  buttonDisabled?: boolean
  titleColor?: string
  buttonRightIcon?: IconName
  titleFont?: (typeof defaultFontStyle)[keyof typeof defaultFontStyle]
  onPress?: () => void
}

export interface CategoryState {
  onCategoryPress: (value: Partial<ServerFromData["category"]>) => void
  selectedCategorySlug: string | undefined
}
