import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type District = Tables['districts']['Row'];
type Facility = Tables['facilities']['Row'];

export const useDistricts = () => {
  return useQuery({
    queryKey: ['districts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as District[];
    },
  });
};

export const useFacilitiesByDistrict = (districtId: string | null) => {
  return useQuery({
    queryKey: ['facilities', districtId],
    enabled: !!districtId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('district_id', districtId)
        .order('name');

      if (error) throw error;
      return data as Facility[];
    },
  });
};