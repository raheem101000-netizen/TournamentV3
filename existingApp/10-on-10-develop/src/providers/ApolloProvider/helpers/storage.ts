import AsyncStorage from "@react-native-async-storage/async-storage"

const STORAGE = "AUTH"

type AuthProps = {
  token?: string
  refreshToken?: string
}

export const storeTokens = async (props: AuthProps) => {
  const oldDetails = await getTokens()
  if (oldDetails) {
    return await AsyncStorage.setItem(STORAGE, JSON.stringify({ ...oldDetails, ...props }))
  }
  return await AsyncStorage.setItem(STORAGE, JSON.stringify(props))
}

export const getTokens = async () => {
  try {
    const authDetails = await AsyncStorage.getItem(STORAGE)
    if (authDetails) {
      const { refreshToken, token } = JSON.parse(authDetails) as AuthProps
      return { refreshToken, token }
    }
  } catch {
    AsyncStorage.clear()
  }
}
