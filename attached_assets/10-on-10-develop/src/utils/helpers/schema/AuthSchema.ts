import { z } from "zod"

import { passwordSchema } from "./default"

export const loginSchema = z.object({
  email: z.string().email({ message: "InvalidEmail" }),
  password: z.string().min(1, { message: "InvalidPassword" }),
})

export const createAccountSchema = z.object({
  fullName: z.string().min(1, { message: "InvalidUsername" }),
  email: z.string().email({ message: "InvalidEmail" }),
  password: passwordSchema,
})

export const requestForForgotPassword = z.object({
  email: z.string().email({ message: "InvalidEmail" }),
})

export const resetPasswordSchema = z.object({
  forgotToken: z.string().min(1, { message: "InvalidToken" }),
  newPassword: passwordSchema,
})
