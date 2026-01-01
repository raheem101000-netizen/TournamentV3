import { memo } from "react"

import { AppCategory, RoleCategory } from "./categories"
import { ACCOUNT_CATEGORIES } from "./constants"
import { CategoryProps } from "./types"

const AccountCategoriesComponent = ({ category, isOrganisator, username }: CategoryProps) => {
  switch (category) {
    case ACCOUNT_CATEGORIES.ROLE:
      return <RoleCategory category={category} isOrganisator={isOrganisator} />
    case ACCOUNT_CATEGORIES.APP:
      return <AppCategory category={category} username={username} />
  }
}

export const AccountCategories = memo(AccountCategoriesComponent)
