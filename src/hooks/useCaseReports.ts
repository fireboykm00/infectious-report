import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type CaseReport = Database['public']['Tables']['case_reports']['Row'];
type CaseReportInsert = Database['public']['Tables']['case_reports']['Insert'];

export function useCaseReports() {
  const queryClient = useQueryClient();

  // Fetch all case reports
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['caseReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select(`
          *,
          reported_by:users(*),
          facility:facilities(*),
          lab_result:lab_results(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create new case report
  const createMutation = useMutation({
    mutationFn: async (newReport: CaseReportInsert) => {
      const { data, error } = await supabase
        .from('case_reports')
        .insert(newReport)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseReports'] });
    },
  });

  // Update case report
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CaseReport>;
    }) => {
      const { data: updatedReport, error } = await supabase
        .from('case_reports')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseReports'] });
    },
  });

  // Delete case report
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('case_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseReports'] });
    },
  });

  return {
    reports,
    isLoading,
    error,
    createReport: createMutation.mutate,
    updateReport: updateMutation.mutate,
    deleteReport: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}