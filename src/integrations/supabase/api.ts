import { supabase } from './client';
import { Json } from './types';
import { Database } from './types';

type Tables = Database['public']['Tables'];
type CaseReportRow = Tables['case_reports']['Row'];
type CaseReportInsert = Tables['case_reports']['Insert'];
type LabResultRow = Tables['lab_results']['Row'];
type LabResultInsert = Tables['lab_results']['Insert'];
type OutbreakRow = Tables['outbreaks']['Row'];
type OutbreakInsert = Tables['outbreaks']['Insert'];

export type CaseReport = CaseReportRow;
export type CaseReportInput = Omit<CaseReportInsert, 'id' | 'created_at' | 'updated_at'>;
export type LabResult = LabResultRow;
export type LabResultInput = Omit<LabResultInsert, 'id' | 'created_at'>;
export type Outbreak = OutbreakRow;
export type OutbreakInput = Omit<OutbreakInsert, 'id' | 'created_at'>;

// Case Reports API
export const caseReportApi = {
  async create(data: CaseReportInput) {
    const { data: result, error } = await supabase
      .from('case_reports')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        symptoms: JSON.stringify(data.symptoms)
      })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async list() {
    const { data, error } = await supabase
      .from('case_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('case_reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Lab Results API
export const labResultApi = {
  async create(data: LabResultInput) {
    const { data: result, error } = await supabase
      .from('lab_results')
      .insert({
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async list() {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*, case_reports(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async attachFile(resultId: string, file: File) {
    const { data, error } = await supabase.storage
      .from('lab-results')
      .upload(`${resultId}/${file.name}`, file, {
        upsert: true
      });
    
    if (error) throw error;
    return data;
  }
};

// Analytics API
export const analyticsApi = {
  async getDiseaseStats() {
    // Using SQL query for proper aggregation
    const { data, error } = await supabase
      .from('case_reports')
      .select('disease_code, status')
      .then(({ data, error }) => {
        if (error) throw error;
        return {
          data: data.reduce((acc: Record<string, Record<string, number>>, curr) => {
            if (!acc[curr.disease_code]) {
              acc[curr.disease_code] = {};
            }
            acc[curr.disease_code][curr.status] = (acc[curr.disease_code][curr.status] || 0) + 1;
            return acc;
          }, {}),
          error: null
        };
      });
    
    if (error) throw error;
    return data;
  },

  async getGeographicDistribution() {
    const { data, error } = await supabase
      .from('case_reports')
      .select('latitude, longitude, disease_code, status')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Outbreak API
export const outbreakApi = {
  async detectOutbreaks() {
    // Using SQL query to detect outbreaks based on case clustering
    const { data, error } = await supabase
      .from('case_reports')
      .select('disease_code, district_id, status')
      .eq('status', 'confirmed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    return data;
  },

  async listOutbreaks() {
    const { data, error } = await supabase
      .from('outbreaks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateOutbreakStatus(id: string, status: Outbreak['status']) {
    const { data, error } = await supabase
      .from('outbreaks')
      .update({ 
        status,
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};