import { useEffect } from "react"
import { BackHandler } from "react-native"

interface IUseExitBackHandler {
  onBackPress: () => void
}

export const useExitBackHandler = ({ onBackPress }: IUseExitBackHandler) => {
  useEffect(() => {
    const triggerBackPress = () => {
      onBackPress()
      return true
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", triggerBackPress)

    return () => backHandler.remove()
  }, [onBackPress])
}
