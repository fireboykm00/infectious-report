import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type CaseReport = Tables['case_reports']['Row'];
type Outbreak = Tables['outbreaks']['Row'];
type Facility = Tables['facilities']['Row'];

// Key factory for React Query
const queryKeys = {
  caseReports: ['case_reports'] as const,
  outbreaks: ['outbreaks'] as const,
  facilities: ['facilities'] as const,
  districts: ['districts'] as const,
  casesByDisease: (disease: string) => [...queryKeys.caseReports, disease] as const,
  casesByRegion: (region: string) => [...queryKeys.caseReports, region] as const,
  caseById: (id: string) => [...queryKeys.caseReports, id] as const,
};

// Fetch all cases with pagination
export const useCaseReports = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [...queryKeys.caseReports, page, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .range((page - 1) * limit, page * limit - 1)
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch cases by disease type
export const useCasesByDisease = (disease: string) => {
  return useQuery({
    queryKey: queryKeys.casesByDisease(disease),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .eq('disease_code', disease)
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch active outbreaks
export const useActiveOutbreaks = () => {
  return useQuery({
    queryKey: queryKeys.outbreaks,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbreaks')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Create a new case report
export const useCreateCaseReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCase: Tables['case_reports']['Insert']) => {
      const { data, error } = await supabase
        .from('case_reports')
        .insert(newCase)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caseReports });
    },
  });
};

// Update a case
export const useUpdateCaseReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CaseReport> & { id: string }) => {
      const { data, error } = await supabase
        .from('case_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caseById(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.caseReports });
    },
  });
};

// Get case statistics
export const useCaseStatistics = () => {
  return useQuery({
    queryKey: ['case-statistics'],
    queryFn: async () => {
      const { data: totalCases, error: totalError } = await supabase
        .from('case_reports')
        .select('status', { count: 'exact' });

      const { data: confirmedCases, error: confirmedError } = await supabase
        .from('case_reports')
        .select('id', { count: 'exact' })
        .eq('status', 'confirmed');

      const { data: activeOutbreaks, error: outbreakError } = await supabase
        .from('outbreaks')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      if (totalError || confirmedError || outbreakError) {
        throw new Error('Failed to fetch statistics');
      }

      return {
        totalCases: totalCases?.length ?? 0,
        confirmedCases: confirmedCases?.length ?? 0,
        activeOutbreaks: activeOutbreaks?.length ?? 0,
      };
    },
  });
};

// Get facilities
export const useFacilities = () => {
  return useQuery({
    queryKey: queryKeys.facilities,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

// Lab Results API
// Get cases pending lab results (status = pending_lab or suspected)
export const usePendingLabCases = () => {
  return useQuery({
    queryKey: ['pending_lab_cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .in('status', ['pending_lab', 'suspected'])
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Get all lab results
export const useLabResults = () => {
  return useQuery({
    queryKey: ['lab_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Create a lab result
export const useCreateLabResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (labResult: {
      case_report_id: string;
      test_type: string;
      result: 'positive' | 'negative' | 'inconclusive';
      tested_at: string;
      lab_technician_id: string;
      notes?: string;
    }) => {
      // Insert lab result
      const { data: resultData, error: resultError } = await supabase
        .from('lab_results')
        .insert(labResult)
        .select()
        .single();

      if (resultError) throw resultError;

      // Update case status based on result
      const newStatus = labResult.result === 'positive' ? 'confirmed' : 
                       labResult.result === 'negative' ? 'ruled_out' : 
                       'pending_lab';

      const { error: updateError } = await supabase
        .from('case_reports')
        .update({ status: newStatus })
        .eq('id', labResult.case_report_id);

      if (updateError) throw updateError;

      return resultData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_results'] });
      queryClient.invalidateQueries({ queryKey: ['pending_lab_cases'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.caseReports });
    },
  });
};

// Analytics API
// Get analytics statistics
export const useAnalyticsStats = (timeRange: string = '7d') => {
  return useQuery({
    queryKey: ['analytics_stats', timeRange],
    queryFn: async () => {
      // Calculate date range
      const now = new Date();
      const days = timeRange === '24h' ? 1 : 
                   timeRange === '7d' ? 7 :
                   timeRange === '30d' ? 30 :
                   timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Get total cases
      const { data: allCases, error: casesError } = await supabase
        .from('case_reports')
        .select('status')
        .gte('report_date', startDate.toISOString());

      if (casesError) throw casesError;

      // Get confirmed cases
      const { data: confirmed } = await supabase
        .from('case_reports')
        .select('id')
        .eq('status', 'confirmed')
        .gte('report_date', startDate.toISOString());

      // Get recovered cases
      const { data: recovered } = await supabase
        .from('case_reports')
        .select('id')
        .eq('status', 'recovered')
        .gte('report_date', startDate.toISOString());

      // Get active outbreaks
      const { data: activeOutbreaks } = await supabase
        .from('outbreaks')
        .select('id')
        .eq('status', 'active');

      const totalCases = allCases?.length || 0;
      const confirmedCases = confirmed?.length || 0;
      const recoveredCases = recovered?.length || 0;
      const recoveryRate = totalCases > 0 ? ((recoveredCases / totalCases) * 100).toFixed(1) : '0';

      return {
        totalCases,
        confirmedCases,
        recoveredCases,
        recoveryRate: `${recoveryRate}%`,
        activeOutbreaks: activeOutbreaks?.length || 0,
        criticalCases: confirmedCases - recoveredCases,
      };
    },
  });
};

// Get disease distribution
export const useDiseaseDistribution = (timeRange: string = '7d') => {
  return useQuery({
    queryKey: ['disease_distribution', timeRange],
    queryFn: async () => {
      const now = new Date();
      const days = timeRange === '24h' ? 1 : 
                   timeRange === '7d' ? 7 :
                   timeRange === '30d' ? 30 :
                   timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('case_reports')
        .select('disease_code, status')
        .gte('report_date', startDate.toISOString());

      if (error) throw error;

      // Group by disease
      const distribution = data?.reduce((acc: any, curr) => {
        const disease = curr.disease_code;
        if (!acc[disease]) {
          acc[disease] = { total: 0, confirmed: 0, suspected: 0 };
        }
        acc[disease].total++;
        if (curr.status === 'confirmed') acc[disease].confirmed++;
        if (curr.status === 'suspected') acc[disease].suspected++;
        return acc;
      }, {});

      return Object.entries(distribution || {}).map(([disease, stats]: [string, any]) => ({
        disease,
        ...stats,
      }));
    },
  });
};

// Get trends data
export const useTrendsData = (timeRange: string = '7d') => {
  return useQuery({
    queryKey: ['trends_data', timeRange],
    queryFn: async () => {
      const now = new Date();
      const days = timeRange === '24h' ? 1 : 
                   timeRange === '7d' ? 7 :
                   timeRange === '30d' ? 30 :
                   timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('case_reports')
        .select('disease_code, report_date')
        .gte('report_date', startDate.toISOString())
        .order('report_date');

      if (error) throw error;

      // Group by date and disease
      const trends: any = {};
      data?.forEach((item) => {
        const date = item.report_date.split('T')[0];
        if (!trends[date]) trends[date] = {};
        if (!trends[date][item.disease_code]) trends[date][item.disease_code] = 0;
        trends[date][item.disease_code]++;
      });

      return Object.entries(trends).map(([date, diseases]) => ({
        date,
        ...diseases,
      }));
    },
  });
};

// Get demographics data
export const useDemographicsData = () => {
  return useQuery({
    queryKey: ['demographics_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('age_group, gender');

      if (error) throw error;

      // Group by age and gender
      const demographics: any = {};
      data?.forEach((item) => {
        const key = `${item.age_group}-${item.gender}`;
        if (!demographics[key]) {
          demographics[key] = { age_group: item.age_group, gender: item.gender, count: 0 };
        }
        demographics[key].count++;
      });

      return Object.values(demographics);
    },
  });
};

// Outbreak Management API
// Detect potential outbreaks (5+ confirmed cases of same disease in 7 days)
export const useDetectOutbreaks = () => {
  return useQuery({
    queryKey: ['detect_outbreaks'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('case_reports')
        .select('disease_code, location_detail, status')
        .gte('report_date', sevenDaysAgo.toISOString())
        .eq('status', 'confirmed');

      if (error) throw error;

      // Group by disease and location
      const clusters: any = {};
      data?.forEach((item) => {
        const key = `${item.disease_code}-${item.location_detail}`;
        if (!clusters[key]) {
          clusters[key] = {
            disease: item.disease_code,
            location: item.location_detail,
            cases: 0,
          };
        }
        clusters[key].cases++;
      });

      // Filter clusters with 5+ cases (potential outbreak)
      return Object.values(clusters)
        .filter((cluster: any) => cluster.cases >= 5)
        .sort((a: any, b: any) => b.cases - a.cases);
    },
  });
};

// Get all outbreaks
export const useOutbreaks = () => {
  return useQuery({
    queryKey: ['outbreaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbreaks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Create outbreak
export const useCreateOutbreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outbreak: {
      disease_code: string;
      location: string;
      case_count: number;
      start_date: string;
      status?: 'active' | 'monitoring' | 'resolved';
    }) => {
      const { data, error } = await supabase
        .from('outbreaks')
        .insert({
          ...outbreak,
          status: outbreak.status || 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbreaks'] });
      queryClient.invalidateQueries({ queryKey: ['detect_outbreaks'] });
    },
  });
};