import { createContext, PropsWithChildren, useContext, useState } from "react"

type AuthProviderContextProps = {
  isLogged: boolean
  setIsLogged: (value: boolean) => void
}

const AuthProviderContext = createContext<AuthProviderContextProps | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLogged, setIsLogged] = useState<boolean>(false)

  const value: AuthProviderContextProps = {
    isLogged,
    setIsLogged,
  }

  return <AuthProviderContext.Provider value={value}>{children}</AuthProviderContext.Provider>
}

export const useAuth = (): AuthProviderContextProps => {
  const context = useContext(AuthProviderContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
