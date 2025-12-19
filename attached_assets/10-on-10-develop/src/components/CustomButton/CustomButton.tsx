import { memo } from "react"

import { CustomButtonVariants } from "./constants"
import { CustomButtonProps } from "./types"
import { CustomButtonMain, CustomButtonSecondary, CustomButtonStandAlone } from "./variants"

const CustomButtonComponent = ({
  variant = CustomButtonVariants.MAIN,
  ...props
}: CustomButtonProps<CustomButtonVariants>) => {
  switch (variant) {
    case CustomButtonVariants.MAIN: {
      return <CustomButtonMain variant={variant} {...props} />
    }
    case CustomButtonVariants.STAND_ALONE: {
      return <CustomButtonStandAlone variant={variant} {...props} />
    }
    case CustomButtonVariants.SECONDARY: {
      return <CustomButtonSecondary variant={variant} {...props} />
    }
  }
}

export const CustomButton = memo(CustomButtonComponent)
