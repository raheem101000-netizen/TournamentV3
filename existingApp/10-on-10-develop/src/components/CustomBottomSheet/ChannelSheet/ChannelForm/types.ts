import { UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { channelSchema } from "./ChannelSchema"

export type ChannelFormData = z.infer<typeof channelSchema>

export type ChannelFormProps = { methods: UseFormReturn<ChannelFormData> }
