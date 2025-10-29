-- Add disease codes table with WHO IDSR priority diseases
-- This solves: Inconsistent case definitions across facilities

-- Create disease_codes table if not exists
CREATE TABLE IF NOT EXISTS public.disease_codes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- epidemic_prone, endemic, neglected, other
  priority TEXT NOT NULL, -- high, medium, low
  icd11_code TEXT,
  symptoms TEXT[] NOT NULL,
  case_definition TEXT NOT NULL,
  reporting_threshold INTEGER NOT NULL,
  reporting_timeframe TEXT NOT NULL, -- immediate, 24h, 7d, 30d
  requires_lab_confirmation BOOLEAN DEFAULT false,
  contact_tracing_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with WHO IDSR priority diseases
INSERT INTO public.disease_codes (code, name, category, priority, icd11_code, symptoms, case_definition, reporting_threshold, reporting_timeframe, requires_lab_confirmation, contact_tracing_required)
VALUES
  -- Epidemic-Prone Diseases (HIGH PRIORITY)
  ('CHOL', 'Cholera', 'epidemic_prone', 'high', '1A00', 
   ARRAY['acute_watery_diarrhea', 'vomiting', 'dehydration'], 
   'Acute watery diarrhea with or without vomiting in persons aged 5 years or more', 
   1, 'immediate', true, true),
   
  ('MEAS', 'Measles', 'epidemic_prone', 'high', '1F03', 
   ARRAY['fever', 'rash', 'cough', 'conjunctivitis'], 
   'Fever and maculopapular rash with cough, coryza or conjunctivitis', 
   1, 'immediate', true, true),
   
  ('YF', 'Yellow Fever', 'epidemic_prone', 'high', '1D47', 
   ARRAY['fever', 'jaundice', 'bleeding', 'abdominal_pain'], 
   'Acute onset of fever with jaundice within 2 weeks of onset', 
   1, 'immediate', true, false),
   
  ('EBOLA', 'Ebola Virus Disease', 'epidemic_prone', 'high', '1D60', 
   ARRAY['fever', 'bleeding', 'vomiting', 'diarrhea', 'weakness'], 
   'Sudden onset of fever with bleeding or contact with suspected case', 
   1, 'immediate', true, true),
   
  ('COVID', 'COVID-19', 'epidemic_prone', 'high', 'RA01', 
   ARRAY['fever', 'cough', 'breathing_difficulty', 'loss_of_taste_smell'], 
   'Acute respiratory illness with fever, cough, or breathing difficulty', 
   5, '24h', true, true),
   
  ('MPOX', 'Monkeypox', 'epidemic_prone', 'high', '1E72', 
   ARRAY['fever', 'rash', 'lymphadenopathy', 'headache'], 
   'Acute rash illness with fever and lymphadenopathy', 
   1, 'immediate', true, true),
   
  ('MENIN', 'Meningococcal Meningitis', 'epidemic_prone', 'high', '1C1B.0', 
   ARRAY['fever', 'headache', 'stiff_neck', 'altered_consciousness'], 
   'Sudden onset of fever with stiff neck or altered consciousness', 
   2, '24h', true, true),
   
  -- Endemic Diseases (MEDIUM PRIORITY)
  ('MAL', 'Malaria', 'endemic', 'medium', '1F40', 
   ARRAY['fever', 'chills', 'sweating', 'headache'], 
   'Fever with or without other symptoms in malaria-endemic area', 
   10, '7d', true, false),
   
  ('TB', 'Tuberculosis', 'endemic', 'medium', '1B10', 
   ARRAY['cough', 'weight_loss', 'night_sweats', 'fever'], 
   'Cough for 2 weeks or more with weight loss and night sweats', 
   10, '7d', true, true),
   
  ('HIV', 'HIV/AIDS', 'endemic', 'medium', '1C62', 
   ARRAY['weight_loss', 'chronic_diarrhea', 'fever', 'opportunistic_infections'], 
   'Clinical signs with positive HIV test', 
   20, '30d', true, false),
   
  -- Other Priority Diseases
  ('DENG', 'Dengue Fever', 'epidemic_prone', 'medium', '1D2Z', 
   ARRAY['fever', 'headache', 'joint_pain', 'rash', 'bleeding'], 
   'Acute febrile illness with headache and joint/muscle pain', 
   5, '7d', true, false),
   
  ('TYPH', 'Typhoid Fever', 'endemic', 'medium', '1A07', 
   ARRAY['fever', 'headache', 'abdominal_pain', 'constipation'], 
   'Prolonged fever with headache and abdominal symptoms', 
   5, '7d', true, false),
   
  ('RABIES', 'Rabies', 'other', 'high', '1C82', 
   ARRAY['hydrophobia', 'altered_consciousness', 'paralysis', 'animal_bite'], 
   'History of animal bite with neurological symptoms', 
   1, 'immediate', false, true),
   
  ('POLIO', 'Acute Flaccid Paralysis (AFP)', 'epidemic_prone', 'high', '8C70', 
   ARRAY['paralysis', 'fever', 'weakness'], 
   'Acute onset of flaccid paralysis in child under 15 years', 
   1, 'immediate', true, false)
ON CONFLICT (code) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_disease_codes_priority ON public.disease_codes(priority);
CREATE INDEX IF NOT EXISTS idx_disease_codes_category ON public.disease_codes(category);

-- Enable RLS
ALTER TABLE public.disease_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read disease codes
CREATE POLICY "Anyone can read disease codes"
  ON public.disease_codes FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can modify disease codes  
CREATE POLICY "Only admins can modify disease codes"
  ON public.disease_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.disease_codes IS 'WHO IDSR priority diseases with standardized case definitions';
