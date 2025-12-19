import { RouteParams, useLocalSearchParams } from "expo-router"

import { ScreenView } from "@/components"
import { CreateEditServerBody, ModalAndHeader } from "@/screens/CreateEditServer"

const CreateEditServer = () => {
  const { serverInfo } = useLocalSearchParams<RouteParams<"/main/[serverInfo]">>()

  return (
    <ScreenView removeHorizontalPadding removeTopInset removeBottomInset>
      <ModalAndHeader serverInfo={serverInfo} />
      <CreateEditServerBody serverInfo={serverInfo} />
    </ScreenView>
  )
}
export default CreateEditServer
