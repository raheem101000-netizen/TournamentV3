import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  LayoutChangeEvent,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native"
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated"

import { CustomButton, CustomButtonVariants, EmptyScreen, ServersList } from "@/components"
import { ServerFromData } from "@/screens/CreateEditServer/components"
import {
  DEFAULT_PADDING_HORIZONTAL,
  DEFAULT_PADDING_TOP,
  defaultFontStyle,
} from "@/utils/constants"
import { CREATE_EDIT_PARAM } from "@/utils/constants/Screens/CreateEditServerParams"
import { useGetAllCategories, useGetServers } from "@/utils/helpers/hook"
import { useThemeColor } from "@/utils/hooks"

import { GamesCategoriesSection } from "./GamesCategoriesSection"

interface IServersSection {
  isOrganisator: boolean
}

interface IEmptyScreenComponent {
  isOrganisator: boolean
}

const ANIMATION_HIDE = 300

const CATEGORY_LIST_HEIGHT = 140

const EmptyScreenComponent = ({ isOrganisator }: IEmptyScreenComponent) => {
  const { t } = useTranslation()
  const { push } = useRouter()

  const onPress = () => {
    push({
      pathname: "/main/[serverInfo]/CreateEditServer",
      params: { serverInfo: CREATE_EDIT_PARAM.CREATE },
    })
  }

  return (
    <EmptyScreen
      title={t("HomeScreen.ServerCards.EmptyServersInformation.Title")}
      description={t("HomeScreen.ServerCards.EmptyServersInformation.Description")}>
      {isOrganisator ? (
        <CustomButton
          variant={CustomButtonVariants.SECONDARY}
          buttonTitle={t("HomeScreen.ServerCards.EmptyServersInformation.Button")}
          onPress={onPress}
        />
      ) : null}
    </EmptyScreen>
  )
}

export const ServersSection = ({ isOrganisator }: IServersSection) => {
  const lastScrollY = useRef(0)
  const isScrolling = useRef(false)
  const lastDirection = useRef<"up" | "down">()
  const { t } = useTranslation()
  const { colors } = useThemeColor()

  const [selectedCategorySlug, setSelectedCategorySlug] =
    useState<Partial<ServerFromData["category"]>>()
  const [hideCategories, setHideCategories] = useState(false)
  const [debounceHide, setDebounceHide] = useState(false)
  const [listTapped, setListTapped] = useState(false)
  const [listHeight, setListHeight] = useState(0)

  const { categories, loadingCategories, hasNextPage, fetchMoreCategories, refetchCategories } =
    useGetAllCategories()

  const {
    servers,
    hasNextPage: hasNextPageServers,
    loading,
    refetch,
    fetchMoreServers,
  } = useGetServers({
    selectedCategorySlug: selectedCategorySlug?.slug,
  })

  const initTextStyle: StyleProp<TextStyle> = {
    color: colors.text.base.default,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
    paddingTop: DEFAULT_PADDING_TOP,
  }

  const categoriesWithAllOption = useMemo(() => {
    if (!categories.length) return []
    const allCategoryOption = {
      slug: undefined,
      name: t("HomeScreen.GamesCategoriesBar.AllCategoriesButtonLabel"),
    }
    return [allCategoryOption, ...categories]
  }, [categories, t])

  const categoryName =
    categories.find(category => category.slug === selectedCategorySlug?.slug)?.name ??
    t("HomeScreen.ServerCards.AllServers")

  const onScroll = useCallback<NonNullable<ScrollViewProps["onScroll"]>>(
    event => {
      event.persist()

      if (servers.length < 5 || !listTapped) return
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
      const currentScrollY = contentOffset.y + (debounceHide ? CATEGORY_LIST_HEIGHT : 0)

      if (currentScrollY < 0 || currentScrollY > contentSize.height - layoutMeasurement.height) {
        isScrolling.current = false
        return
      }

      if (isScrolling.current) {
        if (currentScrollY > lastScrollY.current && lastDirection.current !== "down") {
          setHideCategories(true)
          lastDirection.current = "down"
        } else if (currentScrollY < lastScrollY.current && lastDirection.current !== "up") {
          setHideCategories(false)
          lastDirection.current = "up"
        }
      }
      lastScrollY.current = currentScrollY
      isScrolling.current = true
    },
    [servers.length, listTapped, debounceHide],
  )

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height)
  }, [])

  const animatedCategories = useAnimatedStyle(() => ({
    height: withTiming(debounceHide ? 0 : CATEGORY_LIST_HEIGHT, { duration: ANIMATION_HIDE }),
  }))

  const debounce = useCallback(() => {
    setDebounceHide(hideCategories)
  }, [hideCategories])

  useEffect(() => {
    const timeout = setTimeout(debounce, ANIMATION_HIDE)

    return () => clearInterval(timeout)
  }, [debounce])

  return (
    <View style={styles.container}>
      <Animated.View style={[animatedCategories, { overflow: "hidden" }]}>
        <GamesCategoriesSection
          data={categoriesWithAllOption}
          loadingCategories={loadingCategories}
          selectedCategorySlug={selectedCategorySlug?.slug}
          hasNextPage={!!hasNextPage}
          onCategoryPress={setSelectedCategorySlug}
          fetchMoreCategories={fetchMoreCategories}
          refetch={refetchCategories}
        />
      </Animated.View>
      <Text numberOfLines={1} style={[defaultFontStyle.HEADING, initTextStyle]}>
        {t("HomeScreen.ServerCards.SectionTitle", { name: categoryName })}
      </Text>
      <View style={styles.listWrapper} onLayout={onLayout}>
        <ServersList
          data={servers}
          loading={loading}
          listHeight={listHeight}
          hasNextPage={hasNextPageServers}
          onScroll={onScroll}
          refetch={refetch}
          fetchMore={fetchMoreServers}
          setListTapped={setListTapped}
          EmptyScreenComponent={<EmptyScreenComponent isOrganisator={isOrganisator} />}
        />
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listWrapper: { flex: 1 },
})
