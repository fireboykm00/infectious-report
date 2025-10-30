import { z } from 'zod'

/**
 * Login Validation Schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Signup Validation Schema
 */
export const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name is required (at least 2 characters)'),
  phone: z.string().optional(),
  role: z.enum(['reporter', 'lab_tech', 'district_officer', 'national_officer', 'admin'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
})

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Password Reset Schema
 */
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type PasswordResetInput = z.infer<typeof passwordResetSchema>

/**
 * Password Update Schema
 */
export const passwordUpdateSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>
