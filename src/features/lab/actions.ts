'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { labResultSchema } from '@/lib/validations/lab'

/**
 * Create a lab result and update case status
 */
export async function createLabResult(formData: unknown) {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate input
  const validated = labResultSchema.safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  // Insert lab result
  const { data: labResult, error: resultError } = await supabase
    .from('lab_results')
    .insert({
      ...validated.data,
      lab_technician_id: user.id,
    })
    .select()
    .single()

  if (resultError) {
    console.error('Error creating lab result:', resultError)
    return { error: resultError.message }
  }

  // Update case status based on result
  const newStatus =
    validated.data.result === 'positive'
      ? 'confirmed'
      : validated.data.result === 'negative'
      ? 'ruled_out'
      : 'pending_lab'

  const { error: updateError } = await supabase
    .from('case_reports')
    .update({ status: newStatus })
    .eq('id', validated.data.case_report_id)

  if (updateError) {
    console.error('Error updating case status:', updateError)
    // Don't fail the whole operation if case update fails
  }

  // Revalidate cache
  revalidatePath('/dashboard/lab')
  revalidatePath('/dashboard')

  return { data: labResult, success: true }
}

/**
 * Update a lab result
 */
export async function updateLabResult(id: string, formData: unknown) {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate input (partial update allowed)
  const validated = labResultSchema.partial().safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  // Update lab result
  const { data: labResult, error } = await supabase
    .from('lab_results')
    .update(validated.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating lab result:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard/lab')

  return { data: labResult, success: true }
}
