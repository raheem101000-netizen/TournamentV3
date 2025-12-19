import { useState } from "react"

import { RESET_PASSWORD_STAGE } from "./constants"
import { RequestResetPassword } from "./RequestResetPassword"
import { ResetPassword } from "./ResetPassword"
import { ResetPasswordEnd } from "./ResetPasswordEnd"
import { StageProps } from "./types"

export const ResetPasswordStage = () => {
  const [stage, setStage] = useState<StageProps<RESET_PASSWORD_STAGE>>({
    stage: RESET_PASSWORD_STAGE.REQUEST,
  })

  switch (stage.stage) {
    case RESET_PASSWORD_STAGE.REQUEST:
      return <RequestResetPassword setStage={setStage} />
    case RESET_PASSWORD_STAGE.RESET:
      return <ResetPassword setStage={setStage} stage={stage} />
    case RESET_PASSWORD_STAGE.END:
      return <ResetPasswordEnd />
  }
}
