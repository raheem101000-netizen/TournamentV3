import { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"

import { ToastType } from "@/utils/constants/Toast"
import { DisplayedToast, ToastProps } from "@/utils/types/providers/toast"

import { Toast } from "./Toast"

interface IToasts extends ToastProps {
  resetToast: () => void
}

export const Toasts = ({ message, type = ToastType.SUCCESS, resetToast }: IToasts) => {
  const [toastArray, setToastArray] = useState<DisplayedToast[]>([])

  const deleteToast = (toastId: number) => {
    setToastArray(prevArray => prevArray.filter(toastFromArray => toastFromArray.id !== toastId))
  }

  useEffect(() => {
    if (message) {
      const newToast = { id: Date.now(), message, type }
      setToastArray(prevArray => [...prevArray, newToast])
    }
    return () => resetToast()
  }, [message, resetToast, type])

  return (
    <View style={styles.container}>
      {toastArray.map((toast, idx) => (
        <Toast
          id={toast.id}
          toastIdx={idx}
          message={toast.message}
          type={toast.type}
          key={toast.id}
          deleteToast={deleteToast}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999,
    position: "absolute",
    height: 0,
    top: 12,
    left: 24,
    right: 24,
  },
})
