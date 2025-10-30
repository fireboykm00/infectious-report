'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { createLabResult, updateLabResult } from './actions'
import type { Database } from '@/integrations/supabase/types'

type LabResult = Database['public']['Tables']['lab_results']['Row']
type CaseReport = Database['public']['Tables']['case_reports']['Row']

/**
 * Fetch cases pending lab results
 */
export function usePendingLabCases() {
  return useQuery({
    queryKey: ['pending-lab-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('id, disease_code, age_group, gender, created_at, location_detail, status')
        .in('status', ['pending_lab', 'suspected'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as CaseReport[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Fetch all lab results
 */
export function useLabResults() {
  return useQuery({
    queryKey: ['lab-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*, case_reports(id, disease_code)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as LabResult[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Fetch lab results for a specific case
 */
export function useLabResultsByCase(caseId: string | undefined) {
  return useQuery({
    queryKey: ['lab-results', 'case', caseId],
    queryFn: async () => {
      if (!caseId) throw new Error('Case ID is required')

      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('case_report_id', caseId)
        .order('tested_at', { ascending: false })

      if (error) throw error
      return data as LabResult[]
    },
    enabled: !!caseId,
  })
}

/**
 * Mutation: Create lab result using server action
 */
export function useCreateLabResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLabResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] })
      queryClient.invalidateQueries({ queryKey: ['pending-lab-cases'] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['case-stats'] })
    },
  })
}

/**
 * Mutation: Update lab result using server action
 */
export function useUpdateLabResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateLabResult(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] })
    },
  })
}
