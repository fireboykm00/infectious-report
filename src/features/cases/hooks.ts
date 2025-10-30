'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { createCaseReport, updateCaseReport, deleteCaseReport } from './actions'
import type { Database } from '@/integrations/supabase/types'

type CaseReport = Database['public']['Tables']['case_reports']['Row']

interface CaseFilters {
  disease?: string
  status?: string
  district?: string
  dateFrom?: string
  dateTo?: string
}

/**
 * Fetch cases with optional filters
 * Only fetches necessary fields for performance
 */
export function useCases(filters?: CaseFilters) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('case_reports')
        .select('id, disease_code, status, age_group, gender, created_at, location_detail, symptoms')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filters?.disease) {
        query = query.eq('disease_code', filters.disease)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status as any)
      }
      if (filters?.district) {
        query = query.eq('district_id', filters.district)
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const { data, error } = await query

      if (error) throw error
      return data as CaseReport[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Fetch a single case by ID (full details)
 */
export function useCaseById(id: string | undefined) {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required')

      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as CaseReport
    },
    enabled: !!id,
  })
}

/**
 * Get dashboard statistics using RPC function
 * Much faster than client-side aggregation
 */
export function useCaseStats(districtId?: string) {
  return useQuery({
    queryKey: ['case-stats', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('dashboard_stats' as any, {
        p_district_id: districtId || null,
      })

      if (error) throw error
      
      // Parse JSON response from RPC function
      return (typeof data === 'string' ? JSON.parse(data) : data) as {
        total_cases: number
        confirmed_cases: number
        suspected_cases: number
        pending_lab: number
        ruled_out: number
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

/**
 * Mutation: Create case using server action
 */
export function useCreateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCaseReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['case-stats'] })
    },
  })
}

/**
 * Mutation: Update case using server action
 */
export function useUpdateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCaseReport,
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['cases'] })
        queryClient.invalidateQueries({ queryKey: ['cases', data.data.id] })
      }
    },
  })
}

/**
 * Mutation: Delete case using server action
 */
export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCaseReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['case-stats'] })
    },
  })
}
