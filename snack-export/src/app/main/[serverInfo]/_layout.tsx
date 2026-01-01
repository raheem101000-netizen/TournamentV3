import { Stack, useRouter } from "expo-router"
import { useCallback } from "react"

import { SubScreenHeader } from "@/components"
import { useExitBackHandler } from "@/utils/helpers/hook"

const ServerInfoLayout = () => {
  const { canGoBack, back } = useRouter()

  const goBack = canGoBack()

  const onBackPress = useCallback(() => {
    if (goBack) {
      back()
    }
  }, [back, goBack])

  useExitBackHandler({
    onBackPress,
  })

  return (
    <Stack>
      <Stack.Screen
        name="CreateEditServer"
        options={{
          header: props => <SubScreenHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="ServerInfo"
        options={{
          header: props => <SubScreenHeader {...props} backIcon="ArrowLeft" />,
        }}
      />
      <Stack.Screen
        name="[channel]"
        options={{
          animation: "none",
          header: props => <SubScreenHeader {...props} backIcon="ArrowLeft" />,
        }}
      />
      <Stack.Screen
        name="PlayersList"
        options={{
          animation: "none",
          header: props => <SubScreenHeader {...props} backIcon="ArrowLeft" />,
        }}
      />
    </Stack>
  )
}
export default ServerInfoLayout
