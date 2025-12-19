import { createContext, PropsWithChildren, useContext, useState } from "react"

import { IToastContext, ToastProps } from "@/utils/types/providers/toast"

import { Toasts } from "./Toasts"

const ToastContext = createContext<IToastContext | undefined>(undefined)

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toastParams, setToastParams] = useState<ToastProps>()

  const showToast = ({ message, type }: ToastProps) => {
    setToastParams({
      message,
      type,
    })
  }

  const resetToast = () => {
    setToastParams(undefined)
  }

  const value: IToastContext = {
    showToast,
  }

  return (
    <ToastContext.Provider value={value}>
      <Toasts message={toastParams?.message} resetToast={resetToast} type={toastParams?.type} />
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = (): IToastContext => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
