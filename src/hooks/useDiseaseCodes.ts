import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DiseaseCode = Database['public']['Tables']['disease_codes']['Row'];

export const useDiseaseCodes = () => {
  return useQuery({
    queryKey: ['disease_codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disease_codes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

export const useActiveDiseases = () => {
  return useQuery({
    queryKey: ['active_diseases'],
    queryFn: async () => {
      const { data: activeCases, error } = await supabase
        .from('case_reports')
        .select(`
          disease_code,
          district,
          latitude,
          longitude,
          disease_codes (
            name,
            description,
            severity_level
          )
        `)
        .eq('status', 'confirmed')
        .order('report_date', { ascending: false });

      if (error) throw error;

      // Group by disease and aggregate counts
      const diseaseMap = new Map();
      activeCases?.forEach((caseData) => {
        const { disease_code, disease_codes, latitude, longitude } = caseData;
        if (!diseaseMap.has(disease_code)) {
          diseaseMap.set(disease_code, {
            code: disease_code,
            name: disease_codes?.name,
            description: disease_codes?.description,
            severity: disease_codes?.severity_level,
            cases: [],
          });
        }
        diseaseMap.get(disease_code).cases.push({ latitude, longitude });
      });

      return Array.from(diseaseMap.values());
    },
  });
};