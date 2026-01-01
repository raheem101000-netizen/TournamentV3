import { z } from "zod"

export const channelSchema = z.object({
  name: z.string().min(1, { message: "InvalidTitle" }),
  description: z.string().min(1, { message: "InvalidDescription" }),
  open: z.boolean(),
  tournament: z.boolean(),
})
