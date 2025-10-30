'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { caseReportSchema, caseUpdateSchema } from '@/lib/validations/case'

/**
 * Create a new case report
 * Called from client components via server action
 */
export async function createCaseReport(formData: unknown) {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to create a case report' }
  }

  // Validate input
  const validated = caseReportSchema.safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  // Insert into database
  const { data: caseReport, error } = await supabase
    .from('case_reports')
    .insert({
      ...validated.data,
      reporter_id: user.id,
      report_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating case report:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/report')

  return { data: caseReport, success: true }
}

/**
 * Update an existing case report
 */
export async function updateCaseReport(formData: unknown) {
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
  const validated = caseUpdateSchema.safeParse(formData)

  if (!validated.success) {
    return {
      error: 'Validation failed',
      details: validated.error.flatten().fieldErrors,
    }
  }

  const { id, ...updates } = validated.data

  // Update database
  const { data: caseReport, error } = await supabase
    .from('case_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating case report:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/cases/${id}`)

  return { data: caseReport, success: true }
}

/**
 * Delete a case report
 */
export async function deleteCaseReport(id: string) {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate ID
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid case ID' }
  }

  // Delete from database
  const { error } = await supabase.from('case_reports').delete().eq('id', id)

  if (error) {
    console.error('Error deleting case report:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidatePath('/dashboard')

  return { success: true }
}
