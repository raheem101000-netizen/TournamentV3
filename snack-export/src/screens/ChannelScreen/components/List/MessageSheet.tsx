import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { Dispatch, SetStateAction, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Linking } from "react-native"

import { SheetComponent } from "@/components"
import { CustomAutoScaleSheet } from "@/components/CustomBottomSheet/CustomAutoScaleSheet"
import { REPORT_USER_EMAIL } from "@/utils/constants/ReportEmail"

import { FocusedItem } from "../../types"

type MessageSheetProps = {
  focusedItem: FocusedItem | undefined
  setFocusedItem: Dispatch<SetStateAction<FocusedItem | undefined>>
}

export const MessageSheet = ({ focusedItem, setFocusedItem }: MessageSheetProps) => {
  const { t } = useTranslation()
  const ref = useRef<BottomSheetModalMethods<FocusedItem>>(null)

  useEffect(() => {
    if (focusedItem) {
      ref.current?.present(focusedItem)
    }
  }, [focusedItem])

  const handleCloseSheet = () => setFocusedItem(undefined)

  const handleReportMessage = () => {
    const body = t("Common.ReportMessage.Title", {
      messageId: focusedItem?.item._id,
      userId: focusedItem?.item.user._id,
      text: focusedItem?.item.text ?? "",
    })
    const url = `mailto:${REPORT_USER_EMAIL}?subject=${encodeURIComponent(
      t("Common.ReportMessage.Subject"),
    )}&body=${encodeURIComponent(body)}`
    Linking.openURL(url)
  }

  return (
    <CustomAutoScaleSheet ref={ref} onClose={handleCloseSheet}>
      <SheetComponent title={t("Common.ReportMessage.Subject")} onPress={handleReportMessage} />
    </CustomAutoScaleSheet>
  )
}
