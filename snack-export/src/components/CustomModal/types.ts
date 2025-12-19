export type DoubleButtonModalBodyProps = {
  visible: boolean
  confirmButtonTitle: string
  confirmButtonLoading?: boolean
  confirmButtonDisabled?: boolean
  closeModal: () => void
  onConfirmButtonPress: () => void
}

export type ModalHeadersProps = {
  title: string
  description: string
  subDescription?: string
}
