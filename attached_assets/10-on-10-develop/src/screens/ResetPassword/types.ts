import { RESET_PASSWORD_STAGE } from "./constants"

export type StageProps<T extends RESET_PASSWORD_STAGE> = T extends RESET_PASSWORD_STAGE.RESET
  ? { stage: T; email: string }
  : { stage: T }
