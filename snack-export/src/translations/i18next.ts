import "i18next"

import { en } from "@/translations/en"

import { DEFAULT_LANGUAGE } from "../utils/constants/Languages"
import { RemoveCommentsFromTranslationJson } from "../utils/types/generics"

export enum LanguageKey {
  EN = "en",
}

export interface LanguageProps {
  name: string
}

declare module "i18next" {
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: typeof DEFAULT_LANGUAGE
    // custom resources type
    resources: {
      en: RemoveCommentsFromTranslationJson<typeof en>
    }
  }
}
