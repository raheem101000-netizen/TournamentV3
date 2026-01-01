import { ToastType } from "@/utils/constants/Toast"

export interface ToastProps {
  message: string | undefined
  type?: ToastType
}

export interface DisplayedToast extends ToastProps {
  id: number
}

export interface IToastContext {
  showToast: (toastProps: ToastProps) => void
}
