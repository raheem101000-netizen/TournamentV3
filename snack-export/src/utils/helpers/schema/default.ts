import { z } from "zod"

const number = /^(?=.*?[0-9]).{1,}$/
const upperCase = /^(?=.*?[A-Z]).{1,}$/
const lowerCase = /^(?=.*?[a-z]).{1,}$/
const specialCharacter = /^(?=.*?[#?!@$%^&*-]).{1,}$/

export enum PASSWORD_SCHEMA_ERRORS {
  AT_LEAST_8 = "AtLeast8",
  NUMBER_MISSING = "AtLeastOneNumber",
  UPPER_CASE_MISSING = "UpperCaseMissing",
  LOWER_CASE_MISSING = "LowerCaseMissing",
  SPECIAL_CHARACTER = "SpecialCharacterMissing",
}

export const passwordSchema = z.string().superRefine((password, context) => {
  let errors = ""
  if (password.length < 8) {
    errors += PASSWORD_SCHEMA_ERRORS.AT_LEAST_8
  }

  if (!number.test(password)) {
    if (errors) errors += ", "
    errors += PASSWORD_SCHEMA_ERRORS.NUMBER_MISSING
  }
  if (!upperCase.test(password)) {
    if (errors) errors += ", "
    errors += PASSWORD_SCHEMA_ERRORS.UPPER_CASE_MISSING
  }
  if (!lowerCase.test(password)) {
    if (errors) errors += ", "
    errors += PASSWORD_SCHEMA_ERRORS.LOWER_CASE_MISSING
  }
  if (!specialCharacter.test(password)) {
    if (errors) errors += ", "
    errors += PASSWORD_SCHEMA_ERRORS.SPECIAL_CHARACTER
  }

  if (errors) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: errors,
    })
  }
})
