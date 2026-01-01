import * as Icons from "@/assets/icons"

export type IconNameWithDefaultColor = keyof (typeof Icons)["GoogleIcon"]

export type IconName = Exclude<keyof typeof Icons, IconNameWithDefaultColor>
