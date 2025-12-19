import { PropsWithChildren } from "react"
import { StyleProp, Text, TextStyle } from "react-native"

import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { Divider } from "../Divider"
import { DoubleButtonBody } from "./DoubleButtonBody"
import { DoubleButtonModalBodyProps, ModalHeadersProps } from "./types"

type DoubleButtonModalProps = DoubleButtonModalBodyProps & PropsWithChildren & ModalHeadersProps

export const DoubleButtonModal = ({
  description,
  title,
  subDescription,
  children,
  ...props
}: DoubleButtonModalProps) => {
  const { colors } = useThemeColor()

  const initTitleStyle: StyleProp<TextStyle> = {
    color: colors.text.base.secondary,
  }
  const initDescriptionStyle: StyleProp<TextStyle> = {
    color: colors.text.base.tertiary,
  }
  const initSubDescriptionStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }

  return (
    <DoubleButtonBody {...props}>
      <Text style={[defaultFontStyle.SUBHEADING, initTitleStyle]}>{title}</Text>
      <Divider />
      <Text style={[defaultFontStyle.BODY_BASE, initDescriptionStyle]}>
        {description}
        <Text style={[defaultFontStyle.BODY_STRONG, initSubDescriptionStyle]}>
          {subDescription}
        </Text>
      </Text>
      {children}
    </DoubleButtonBody>
  )
}
