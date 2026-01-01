import { TypePolicies } from "@apollo/client"

import { categories } from "./categoriesField"
import { serversByCategory } from "./serversByCategoryField"

export const GuestQuery: TypePolicies = {
  GuestQuery: {
    merge: true,
    fields: {
      categories,
      serversByCategory,
    },
  },
}
