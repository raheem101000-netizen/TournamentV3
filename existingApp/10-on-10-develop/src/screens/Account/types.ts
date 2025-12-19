import { ACCOUNT_CATEGORIES } from "./constants"

export type CategoryProps = {
  category: ACCOUNT_CATEGORIES
  isOrganisator: boolean
  username?: string
}
