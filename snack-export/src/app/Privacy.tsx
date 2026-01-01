import { useQuery } from "@apollo/client"
import { useRouter } from "expo-router"
import { PropsWithChildren, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { RefreshControl, Text, View } from "react-native"

import { PRIVACY } from "@/cms/gql"
import { CustomAwareView, CustomButton, EmptyScreen, ScreenView } from "@/components"
import { cmsClient } from "@/providers/CmsApolloProvider"
import { defaultFontStyle } from "@/utils/constants"
import { useExitBackHandler } from "@/utils/helpers/hook"
import { useThemeColor } from "@/utils/hooks"

enum Titles {
  H1 = "H1",
  H2 = "H2",
  H3 = "H3",
  BODY = "body",
}

type Content = {
  type: Titles
  body: string
}

const regex = /^(# .*)$|^(## .*)$|^(### .*)$|^([^#\n].*)$/gm

const ContentTexts = ({ type, children }: Pick<Content, "type"> & PropsWithChildren) => {
  const { colors } = useThemeColor()
  switch (type) {
    case Titles.H1:
      return (
        <Text style={[defaultFontStyle.HEADING, { color: colors.text.base.default }]}>
          {children}
        </Text>
      )
    case Titles.H2:
      return (
        <Text
          style={[
            defaultFontStyle.SUBHEADING,
            { color: colors.text.base.default, paddingLeft: 8, paddingTop: 12 },
          ]}>
          {children}
        </Text>
      )
    case Titles.H3:
      return (
        <Text
          style={[
            defaultFontStyle.BODY_SMALL,
            { color: colors.text.base.default, paddingLeft: 16, paddingTop: 8 },
          ]}>
          {children}
        </Text>
      )
    case Titles.BODY:
      return (
        <Text
          style={[
            defaultFontStyle.BODY_BASE,
            { color: colors.text.base.default, paddingLeft: 24, paddingTop: 4 },
          ]}>
          {children}
        </Text>
      )
  }
}

const TermsModal = () => {
  const { canGoBack, back } = useRouter()
  const { t } = useTranslation()
  const { colors } = useThemeColor()
  const { data, loading, refetch } = useQuery(PRIVACY, {
    client: cmsClient,
  })

  const goBack = canGoBack()

  const content = data?.listpolicy?.[0]?.body

  const contentArray: Content[] = [...(content?.matchAll(regex) ?? [])].map(match => {
    if (match[1]) {
      return { type: Titles.H1, body: match[1].replace("# ", "") }
    } else if (match[2]) {
      return { type: Titles.H2, body: match[2].replace("## ", "") }
    } else if (match[3]) {
      return { type: Titles.H3, body: match[3].replace("### ", "") }
    }
    return { type: Titles.BODY, body: match[4].replace('"', "") }
  })

  const onBackPress = useCallback(() => {
    if (goBack) {
      back()
    }
  }, [back, goBack])

  useExitBackHandler({
    onBackPress,
  })

  const handleRefetch = () => {
    refetch()
  }

  return (
    <ScreenView removeTopInset removeBottomInset removeHorizontalPadding>
      <CustomAwareView
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.icon.base.default}
          />
        }
        insetBottom>
        {contentArray.length === 0 ? (
          loading ? null : (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <EmptyScreen
                title={t("Common.NoInternetConnectionEmptyState.Title")}
                description={t("Common.NoInternetConnectionEmptyState.Description")}>
                <CustomButton
                  buttonTitle={t("Common.NoInternetConnectionEmptyState.ButtonTitle")}
                  onPress={handleRefetch}
                  loading={loading}
                />
              </EmptyScreen>
            </View>
          )
        ) : (
          contentArray.map(({ body, type }, idx) => {
            return (
              <ContentTexts key={idx} type={type}>
                {body}
              </ContentTexts>
            )
          })
        )}
      </CustomAwareView>
    </ScreenView>
  )
}

export default TermsModal
