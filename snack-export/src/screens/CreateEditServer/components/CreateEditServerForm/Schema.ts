import { z } from "zod"

const categorySchema = z.object({
  slug: z.string().trim().min(1, { message: "InvalidCategory" }),
  name: z.string().trim().min(1, { message: "InvalidName" }),
})

export const serverSchema = z.object({
  serverTitle: z.string().trim().min(1, { message: "InvalidTitle" }),
  serverDescription: z.string().trim().min(1, { message: "InvalidDescription" }),
  category: categorySchema,
})

export type ServerFromData = z.infer<typeof serverSchema>
