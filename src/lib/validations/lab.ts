import { z } from 'zod'

/**
 * Lab Result Validation Schema
 */
export const labResultSchema = z.object({
  case_report_id: z.string().uuid('Invalid case report ID'),
  test_type: z.string().min(1, 'Test type is required'),
  result: z.enum(['positive', 'negative', 'inconclusive'], {
    errorMap: () => ({ message: 'Please select a valid test result' }),
  }),
  tested_at: z.string().datetime('Invalid date format'),
  lab_facility_id: z.string().uuid('Invalid lab facility').optional(),
  notes: z.string().optional(),
  attachments: z.any().optional(), // JSONB field
})

export type LabResultInput = z.infer<typeof labResultSchema>

/**
 * Schema for updating lab results
 */
export const labResultUpdateSchema = labResultSchema.partial().extend({
  id: z.string().uuid('Invalid lab result ID'),
})

export type LabResultUpdateInput = z.infer<typeof labResultUpdateSchema>
