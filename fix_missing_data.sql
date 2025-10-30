-- ============================================================================
-- FIX: Missing Disease Codes and Initial Data
-- Run this in Supabase SQL Editor to fix foreign key errors
-- ============================================================================

-- Insert WHO IDSR Priority Disease Codes
INSERT INTO disease_codes (code, name, description, symptoms, is_notifiable, alert_threshold, threshold_days, is_active)
VALUES
  -- Bacterial Diseases
  ('CHOL', 'Cholera', 'Acute diarrheal disease caused by Vibrio cholerae', 
   ARRAY['watery diarrhea', 'vomiting', 'dehydration', 'rapid heart rate'], 
   true, 1, 1, true),
   
  ('MENING', 'Meningitis', 'Inflammation of protective membranes of brain/spinal cord',
   ARRAY['fever', 'headache', 'stiff neck', 'confusion', 'sensitivity to light'],
   true, 2, 7, true),
   
  ('PLAGUE', 'Plague', 'Disease caused by Yersinia pestis bacteria',
   ARRAY['fever', 'chills', 'weakness', 'swollen lymph nodes'],
   true, 1, 1, true),
   
  -- Viral Diseases
  ('MEAS', 'Measles', 'Highly contagious viral disease',
   ARRAY['fever', 'cough', 'runny nose', 'red eyes', 'rash'],
   true, 1, 7, true),
   
  ('YF', 'Yellow Fever', 'Viral disease transmitted by mosquitoes',
   ARRAY['fever', 'headache', 'jaundice', 'muscle pain', 'nausea'],
   true, 1, 1, true),
   
  ('VHF', 'Viral Hemorrhagic Fever', 'Group of illnesses caused by viruses',
   ARRAY['fever', 'bleeding', 'fatigue', 'dizziness'],
   true, 1, 1, true),
   
  ('EBOLA', 'Ebola Virus Disease', 'Severe, often fatal illness',
   ARRAY['fever', 'severe headache', 'muscle pain', 'weakness', 'fatigue', 'bleeding'],
   true, 1, 1, true),
   
  ('COVID', 'COVID-19', 'Disease caused by SARS-CoV-2 virus',
   ARRAY['fever', 'cough', 'shortness of breath', 'fatigue', 'loss of taste/smell'],
   true, 5, 7, true),
   
  ('POLIO', 'Poliomyelitis', 'Viral disease affecting spinal cord',
   ARRAY['fever', 'fatigue', 'headache', 'stiffness', 'limb pain', 'paralysis'],
   true, 1, 1, true),
   
  -- Vector-borne Diseases
  ('MALA', 'Malaria', 'Parasitic disease transmitted by mosquitoes',
   ARRAY['fever', 'chills', 'sweating', 'headache', 'nausea', 'vomiting'],
   true, 10, 7, true),
   
  ('DENGUE', 'Dengue Fever', 'Mosquito-borne viral infection',
   ARRAY['high fever', 'severe headache', 'pain behind eyes', 'joint pain', 'rash'],
   true, 5, 7, true),
   
  ('CHIK', 'Chikungunya', 'Viral disease transmitted by mosquitoes',
   ARRAY['fever', 'severe joint pain', 'muscle pain', 'headache', 'rash'],
   true, 5, 7, true),
   
  -- Zoonotic Diseases
  ('RABIES', 'Rabies', 'Viral disease transmitted through animal bites',
   ARRAY['fever', 'headache', 'confusion', 'agitation', 'hydrophobia', 'paralysis'],
   true, 1, 1, true),
   
  ('ANTHRAX', 'Anthrax', 'Bacterial disease from Bacillus anthracis',
   ARRAY['fever', 'chest discomfort', 'shortness of breath', 'skin ulcer'],
   true, 1, 1, true),
   
  -- Other Priority Diseases
  ('AFP', 'Acute Flaccid Paralysis', 'Sudden onset of paralysis',
   ARRAY['sudden weakness', 'loss of muscle tone', 'reduced reflexes'],
   true, 1, 1, true),
   
  ('NNT', 'Neonatal Tetanus', 'Tetanus in newborns',
   ARRAY['inability to suck', 'rigid muscles', 'spasms', 'arched back'],
   true, 1, 1, true),
   
  ('DIPH', 'Diphtheria', 'Bacterial infection affecting mucous membranes',
   ARRAY['sore throat', 'fever', 'swollen glands', 'difficulty breathing', 'gray membrane in throat'],
   true, 1, 1, true),
   
  ('PERTUS', 'Pertussis', 'Whooping cough',
   ARRAY['runny nose', 'mild fever', 'severe coughing fits', 'whooping sound'],
   true, 5, 7, true),
   
  ('TYPHOID', 'Typhoid Fever', 'Bacterial infection from Salmonella typhi',
   ARRAY['prolonged fever', 'weakness', 'stomach pain', 'headache', 'loss of appetite'],
   true, 5, 7, true),
   
  ('HIV', 'HIV/AIDS', 'Human Immunodeficiency Virus',
   ARRAY['fever', 'fatigue', 'swollen lymph nodes', 'weight loss', 'night sweats'],
   true, 10, 30, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  symptoms = EXCLUDED.symptoms,
  is_notifiable = EXCLUDED.is_notifiable,
  alert_threshold = EXCLUDED.alert_threshold,
  threshold_days = EXCLUDED.threshold_days,
  updated_at = NOW();

-- Create sample districts if they don't exist
INSERT INTO districts (name, code, province, population)
VALUES
  ('Gasabo', 'GAS', 'Kigali City', 530907),
  ('Kicukiro', 'KIC', 'Kigali City', 318787),
  ('Nyarugenge', 'NYA', 'Kigali City', 284561),
  ('Musanze', 'MUS', 'Northern Province', 368267),
  ('Rubavu', 'RUB', 'Western Province', 388266)
ON CONFLICT (name) DO NOTHING;

-- Create sample facilities
INSERT INTO facilities (name, district_id, type, is_active)
SELECT 
  'Kigali University Teaching Hospital',
  (SELECT id FROM districts WHERE code = 'GAS' LIMIT 1),
  'Hospital',
  true
WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE name = 'Kigali University Teaching Hospital');

INSERT INTO facilities (name, district_id, type, is_active)
SELECT 
  'Nyarugenge District Hospital',
  (SELECT id FROM districts WHERE code = 'NYA' LIMIT 1),
  'Hospital',
  true
WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE name = 'Nyarugenge District Hospital');

INSERT INTO facilities (name, district_id, type, is_active)
SELECT 
  'Gasabo Health Center',
  (SELECT id FROM districts WHERE code = 'GAS' LIMIT 1),
  'Health Center',
  true
WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE name = 'Gasabo Health Center');

-- Verify data was inserted
SELECT 
  'Disease Codes Inserted' as info,
  COUNT(*) as count 
FROM disease_codes;

SELECT 
  'Districts Created' as info,
  COUNT(*) as count 
FROM districts;

SELECT 
  'Facilities Created' as info,
  COUNT(*) as count 
FROM facilities;

-- Show available disease codes
SELECT code, name, alert_threshold 
FROM disease_codes 
ORDER BY name;
