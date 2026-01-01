import { getLocales } from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { DEFAULT_LANGUAGE } from "@/utils/constants/Languages"

import { en } from "./en"
import { LanguageKey } from "./i18next"

type ResourceChecker = Record<LanguageKey, Record<"translation", typeof en>>

export const resources: ResourceChecker = {
  en: { translation: en },
}

i18n.use(initReactI18next).init({
  fallbackLng: { default: [DEFAULT_LANGUAGE] },
  lng: getLocales()[0].languageTag.slice(0, 2).toLocaleLowerCase(),
  resources,
  debug: false,
  interpolation: { escapeValue: true },
  compatibilityJSON: "v3",
})

export default i18n
