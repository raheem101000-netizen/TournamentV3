import { $, FromSelector, Selector } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

const GetAllCategoriesSelector = Selector("Category")({
  slug: true,
  name: true,
  image_thumbnail: true,
  image: true,
})

export const GET_ALL_CATEGORIES = typedGql("query")({
  users: {
    publicUsers: {
      guest: {
        categories: [
          { pageInput: $("pageInput", "PageInput!") },
          {
            categories: GetAllCategoriesSelector,
            pageInfo: {
              hasNext: true,
              total: true,
            },
          },
        ],
      },
    },
  },
})

export type AllCategoriesProps = FromSelector<typeof GetAllCategoriesSelector, "Category">
