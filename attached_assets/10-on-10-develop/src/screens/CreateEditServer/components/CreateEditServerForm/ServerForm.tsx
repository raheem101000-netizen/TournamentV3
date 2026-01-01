import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { ChannelList, ChannelSheetType, CustomAwareView } from "@/components"
import { DEFAULT_PADDING, defaultFontStyle } from "@/utils/constants"
import { CREATE_EDIT_PARAM } from "@/utils/constants/Screens/CreateEditServerParams"
import { useThemeColor } from "@/utils/hooks"

import { MainCreateEditProps } from "../../types"
import { CreateEditButton } from "./CreateEditButton"
import { ServerControllers } from "./Form"
import { ServerFromData, serverSchema } from "./Schema"

interface ICreateEditServerForm extends MainCreateEditProps {
  defaultValues: ServerFromData
  buttonLoading: boolean
  loadingGetServer: boolean
  handleSubmit: (fields: ServerFromData) => void
}

export const CreateEditServerForm = ({
  defaultValues,
  loadingGetServer,
  buttonLoading,
  serverInfo,
  handleSubmit,
}: ICreateEditServerForm) => {
  const { colors } = useThemeColor()
  const { t } = useTranslation()
  const [listHeight, setListHeight] = useState(0)

  const methods = useForm<ServerFromData>({
    resolver: zodResolver(serverSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  const differentFieldsArray = Object.keys(serverSchema.shape).map(field => {
    const fieldName = field as keyof ServerFromData
    const watchedValue = methods.watch(fieldName)
    if (typeof watchedValue === "string") {
      return watchedValue !== defaultValues[fieldName]
    }
    return watchedValue.slug !== defaultValues.category.slug
  })

  const buttonDisabled = useMemo(() => {
    return Object.keys(methods.formState.errors).length !== 0 ||
      serverInfo === CREATE_EDIT_PARAM.CREATE
      ? differentFieldsArray.includes(false)
      : !differentFieldsArray.includes(true)
  }, [differentFieldsArray, methods.formState.errors, serverInfo])

  const initContainerStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.background.accent.secondary,
  }

  const initMainText: StyleProp<TextStyle> = {
    color: colors.text.base.tertiary,
  }
  const initRequiredStartText: StyleProp<TextStyle> = {
    color: colors.text.danger.default,
  }

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setListHeight(nativeEvent.layout.height)
  }

  return (
    <FormProvider {...methods}>
      <CustomAwareView removePaddingHorizontal contentContainerStyle={styles.contentContainerStyle}>
        <View style={[styles.container, initContainerStyle]}>
          <Text style={[defaultFontStyle.BODY_BASE, initMainText]}>
            {t("CreateEditServer.AllFieldsRequired.FirstPart")}
            <Text style={initRequiredStartText}>{" * "}</Text>
            {t("CreateEditServer.AllFieldsRequired.SecondPart")}
          </Text>
          <ServerControllers />
        </View>
        {serverInfo !== CREATE_EDIT_PARAM.CREATE ? (
          <View style={styles.channelWrapper} onLayout={onLayout}>
            <ChannelList listHeight={listHeight} serverHost type={ChannelSheetType.EDIT} />
          </View>
        ) : null}
      </CustomAwareView>
      <CreateEditButton
        buttonDisabled={buttonDisabled}
        serverInfo={serverInfo}
        buttonLoading={buttonLoading || loadingGetServer}
        onPress={methods.handleSubmit(handleSubmit)}
      />
    </FormProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 1,
    padding: DEFAULT_PADDING,
    gap: 24,
  },
  contentContainerStyle: {
    flex: 1,
    paddingBottom: 0,
    paddingTop: 0,
  },
  channelWrapper: { flex: 1, minHeight: 56 },
})
