export type RemoveCommentsFromTranslationJson<T> = T extends object
  ? T extends (infer U)[]
    ? RemoveCommentsFromTranslationJson<U>[]
    : {
        [K in keyof T as K extends "__comment__" ? never : K]: RemoveCommentsFromTranslationJson<
          T[K]
        >
      }
  : T
