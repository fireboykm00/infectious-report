import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type LabResult = Database['public']['Tables']['lab_results']['Row'];
type LabResultInsert = Database['public']['Tables']['lab_results']['Insert'];

export function useLabResults(caseReportId?: string) {
  const queryClient = useQueryClient();

  // Fetch lab results for a specific case
  const { data: labResults, isLoading, error } = useQuery({
    queryKey: ['labResults', caseReportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          technician:users(*)
        `)
        .eq('case_report_id', caseReportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!caseReportId, // Only run query if caseReportId is provided
  });

  // Create new lab result
  const createMutation = useMutation({
    mutationFn: async (newResult: LabResultInsert) => {
      const { data, error } = await supabase
        .from('lab_results')
        .insert(newResult)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['labResults', variables.case_report_id] 
      });
      // Also invalidate the case report to update its status
      queryClient.invalidateQueries({ 
        queryKey: ['caseReports'] 
      });
    },
  });

  // Update lab result
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<LabResult>;
    }) => {
      const { data: updatedResult, error } = await supabase
        .from('lab_results')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['labResults'] 
      });
    },
  });

  // Upload attachment
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      labResultId,
    }: {
      file: File;
      labResultId: string;
    }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `lab-results/${labResultId}/${Math.random()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Update lab result with attachment URL
      const { data, error } = await supabase
        .from('lab_results')
        .update({ attachment_url: publicUrl })
        .eq('id', labResultId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labResults'] });
    },
  });

  return {
    labResults,
    isLoading,
    error,
    createLabResult: createMutation.mutate,
    updateLabResult: updateMutation.mutate,
    uploadAttachment: uploadMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
  };
}