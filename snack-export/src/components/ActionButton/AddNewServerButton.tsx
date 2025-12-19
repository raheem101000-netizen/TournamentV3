import { useRouter } from "expo-router"
import { StyleSheet, View } from "react-native"

import { CREATE_EDIT_PARAM } from "@/utils/constants/Screens/CreateEditServerParams"

import { ButtonMain } from "./ButtonMain"

interface IAddNewServerButton {
  isOrganisator: boolean
}
export const AddNewServerButton = ({ isOrganisator }: IAddNewServerButton) => {
  const { push } = useRouter()

  const onPress = () => {
    push({
      pathname: "/main/[serverInfo]/CreateEditServer",
      params: { serverInfo: CREATE_EDIT_PARAM.CREATE },
    })
  }

  return (
    <View style={styles.wrapper}>
      {isOrganisator ? <ButtonMain icon="Plus" onPress={onPress} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", bottom: 16, right: 16 },
})
