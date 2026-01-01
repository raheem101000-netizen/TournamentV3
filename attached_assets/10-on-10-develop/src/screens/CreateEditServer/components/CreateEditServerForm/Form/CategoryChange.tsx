import { BottomSheetModal } from "@gorhom/bottom-sheet"
import { useCallback, useRef } from "react"
import { View } from "react-native"

import { CategoriesListSheet, CustomInput } from "@/components"
import { useGetAllCategories } from "@/utils/helpers/hook"

import { ServerFromData } from "../Schema"

interface ICategoryChange {
  value: Partial<ServerFromData["category"]>
  error: boolean
  placeholder: string
  labelText: string
  onBlur: () => void
  onChange: (value: Partial<ServerFromData["category"]>) => void
}

export const CategoryChange = ({
  value,
  error,
  labelText,
  placeholder,
  onBlur,
  onChange,
}: ICategoryChange) => {
  const categoriesListSheetRef = useRef<BottomSheetModal>(null)

  const { categories, loadingCategories, hasNextPage, fetchMoreCategories } = useGetAllCategories()

  const onEditPress = useCallback(() => {
    categoriesListSheetRef.current?.present()
  }, [categoriesListSheetRef])

  const handleSelectCategory = (category: typeof value) => {
    onBlur()
    onChange(category)
  }

  return (
    <View>
      <CustomInput
        editable={false}
        value={value.name}
        error={error}
        labelText={labelText}
        placeholder={placeholder}
        onPress={onEditPress}
        rightIcon={{
          icon: "ChevronDown",
        }}
      />
      <CategoriesListSheet
        data={categories}
        loadingCategories={loadingCategories}
        hasNextPage={hasNextPage}
        sheetRef={categoriesListSheetRef}
        selectedCategorySlug={value.slug}
        onCategoryPress={handleSelectCategory}
        fetchMoreCategories={fetchMoreCategories}
      />
    </View>
  )
}
