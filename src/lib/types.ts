import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

export interface Disease {
  code: string;
  name: string;
  description: string | null;
  severity: number;
  cases: Array<{
    latitude: number;
    longitude: number;
  }>;
}

export interface DiseaseStats {
  totalCases: number;
  confirmedCases: number;
  activeOutbreaks: number;
}

export type CaseReport = Tables['case_reports']['Row'] & {
  disease_codes?: Tables['disease_codes']['Row'];
  facilities?: Tables['facilities']['Row'];
  districts?: Tables['districts']['Row'];
};

export type CaseReportInput = Omit<Tables['case_reports']['Insert'], 'id' | 'reported_date'>;

export type Outbreak = Tables['outbreaks']['Row'] & {
  districts?: Tables['districts']['Row'];
  disease_codes?: Tables['disease_codes']['Row'];
};

export type OutbreakInput = Omit<Tables['outbreaks']['Insert'], 'id' | 'start_date'>;