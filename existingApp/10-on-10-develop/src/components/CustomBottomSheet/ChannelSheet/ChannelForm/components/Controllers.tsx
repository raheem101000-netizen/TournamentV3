import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native"

import { CustomInput } from "@/components/CustomInput"
import { defaultFontStyle } from "@/utils/constants"
import { useThemeColor } from "@/utils/hooks"

import { ChannelFormProps } from "../types"
import { ChannelType } from "./ChannelType"
import { TournamentChannel } from "./TournamentChannel"

export const Controllers = ({ methods }: ChannelFormProps) => {
  const { colors } = useThemeColor()
  const { t } = useTranslation()

  const initHeaderStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
  }
  const initAdditionalHeaderStyle: StyleProp<TextStyle> = {
    color: colors.text.danger.default,
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={[defaultFontStyle.BODY_STRONG, initHeaderStyle]}>
          <Text style={initAdditionalHeaderStyle}>{"*"}</Text>
          {t("ServerInfo.BottomSheet.ChannelType.Title")}
        </Text>
        <Controller
          name="open"
          control={methods.control}
          render={({ field: { onChange, value } }) => {
            return <ChannelType onChange={onChange} value={value} />
          }}
        />
      </View>
      <View style={styles.container}>
        <Text style={[defaultFontStyle.BODY_STRONG, initHeaderStyle]}>
          {t("ServerInfo.BottomSheet.ChannelTournament")}
        </Text>
        <Controller
          name="tournament"
          control={methods.control}
          render={({ field: { onChange, value } }) => {
            return <TournamentChannel onChange={onChange} value={value} />
          }}
        />
      </View>
      <View style={styles.container}>
        <Text style={[defaultFontStyle.BODY_STRONG, initHeaderStyle]}>
          {t("ServerInfo.BottomSheet.ChannelContent")}
        </Text>
        <Controller
          name="name"
          control={methods.control}
          render={({ field: { name, onChange, onBlur, value }, fieldState: { error } }) => {
            return (
              <CustomInput
                placeholder={t(`ServerInfo.BottomSheet.Placeholder.${name}`)}
                required
                autoCapitalize="none"
                error={!!error}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )
          }}
        />
        <Controller
          name="description"
          control={methods.control}
          render={({ field: { name, onChange, onBlur, value }, fieldState: { error } }) => {
            return (
              <CustomInput
                placeholder={t(`ServerInfo.BottomSheet.Placeholder.${name}`)}
                required
                autoCapitalize="none"
                textAlignVertical="top"
                multiline
                error={!!error}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )
          }}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
})
