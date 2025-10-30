import { z } from 'zod'

/**
 * Case Report Validation Schema
 * Used for both client-side and server-side validation
 */
export const caseReportSchema = z.object({
  disease_code: z.string().min(1, 'Disease is required'),
  age_group: z.enum(['0-5', '6-17', '18-49', '50-64', '65+'], {
    errorMap: () => ({ message: 'Please select a valid age group' }),
  }),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  symptoms: z.string().min(10, 'Please describe symptoms (at least 10 characters)'),
  location_detail: z.string().min(1, 'Location is required'),
  district_id: z.string().uuid('Invalid district').optional(),
  facility_id: z.string().uuid('Invalid facility').optional(),
  status: z
    .enum(['suspected', 'confirmed', 'ruled_out', 'pending_lab'])
    .default('suspected'),
  notes: z.string().optional(),
  attachments: z.any().optional(), // JSONB field
})

export type CaseReportInput = z.infer<typeof caseReportSchema>

/**
 * Schema for updating existing case reports
 * All fields are optional except id
 */
export const caseUpdateSchema = caseReportSchema.partial().extend({
  id: z.string().uuid('Invalid case ID'),
})

export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>

/**
 * Filter schema for querying cases
 */
export const caseFilterSchema = z.object({
  disease: z.string().optional(),
  status: z.enum(['suspected', 'confirmed', 'ruled_out', 'pending_lab']).optional(),
  district: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type CaseFilter = z.infer<typeof caseFilterSchema>
