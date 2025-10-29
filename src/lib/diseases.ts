/**
 * Disease Codes and Case Definitions for IDSR
 * Based on WHO IDSR priority diseases for Africa
 */

export interface DiseaseDefinition {
  code: string;
  name: string;
  category: 'epidemic_prone' | 'endemic' | 'neglected' | 'other';
  priority: 'high' | 'medium' | 'low';
  icd11_code?: string;
  symptoms: string[];
  case_definition: string;
  reporting_threshold: number; // Cases that trigger alert
  reporting_timeframe: string; // '24h', '7d', etc.
  requires_lab_confirmation: boolean;
  contact_tracing_required: boolean;
}

export const PRIORITY_DISEASES: DiseaseDefinition[] = [
  // Epidemic-Prone Diseases
  {
    code: 'CHOL',
    name: 'Cholera',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '1A00',
    symptoms: ['acute_watery_diarrhea', 'vomiting', 'dehydration'],
    case_definition: 'Acute watery diarrhea with or without vomiting in persons aged 5 years or more',
    reporting_threshold: 1, // Report immediately
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  {
    code: 'MEAS',
    name: 'Measles',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '1F03',
    symptoms: ['fever', 'rash', 'cough', 'conjunctivitis'],
    case_definition: 'Fever and maculopapular rash with cough, coryza or conjunctivitis',
    reporting_threshold: 1,
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  {
    code: 'YF',
    name: 'Yellow Fever',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '1D47',
    symptoms: ['fever', 'jaundice', 'bleeding', 'abdominal_pain'],
    case_definition: 'Acute onset of fever with jaundice within 2 weeks of onset',
    reporting_threshold: 1,
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: true,
    contact_tracing_required: false,
  },
  {
    code: 'EBOLA',
    name: 'Ebola Virus Disease',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '1D60',
    symptoms: ['fever', 'bleeding', 'vomiting', 'diarrhea', 'weakness'],
    case_definition: 'Sudden onset of fever with bleeding or contact with suspected case',
    reporting_threshold: 1,
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  {
    code: 'COVID',
    name: 'COVID-19',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: 'RA01',
    symptoms: ['fever', 'cough', 'breathing_difficulty', 'loss_of_taste_smell'],
    case_definition: 'Acute respiratory illness with fever, cough, or breathing difficulty',
    reporting_threshold: 5,
    reporting_timeframe: '24h',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  {
    code: 'MPOX',
    name: 'Monkeypox',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '1E72',
    symptoms: ['fever', 'rash', 'lymphadenopathy', 'headache'],
    case_definition: 'Acute rash illness with fever and lymphadenopathy',
    reporting_threshold: 1,
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  {
    code: 'MENIN',
    name: 'Meningococcal Meningitis',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '1C1B.0',
    symptoms: ['fever', 'headache', 'stiff_neck', 'altered_consciousness'],
    case_definition: 'Sudden onset of fever with stiff neck or altered consciousness',
    reporting_threshold: 2,
    reporting_timeframe: '24h',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  
  // Endemic Diseases
  {
    code: 'MAL',
    name: 'Malaria',
    category: 'endemic',
    priority: 'medium',
    icd11_code: '1F40',
    symptoms: ['fever', 'chills', 'sweating', 'headache'],
    case_definition: 'Fever with or without other symptoms in malaria-endemic area',
    reporting_threshold: 10,
    reporting_timeframe: '7d',
    requires_lab_confirmation: true,
    contact_tracing_required: false,
  },
  {
    code: 'TB',
    name: 'Tuberculosis',
    category: 'endemic',
    priority: 'medium',
    icd11_code: '1B10',
    symptoms: ['cough', 'weight_loss', 'night_sweats', 'fever'],
    case_definition: 'Cough for 2 weeks or more with weight loss and night sweats',
    reporting_threshold: 10,
    reporting_timeframe: '7d',
    requires_lab_confirmation: true,
    contact_tracing_required: true,
  },
  {
    code: 'HIV',
    name: 'HIV/AIDS',
    category: 'endemic',
    priority: 'medium',
    icd11_code: '1C62',
    symptoms: ['weight_loss', 'chronic_diarrhea', 'fever', 'opportunistic_infections'],
    case_definition: 'Clinical signs with positive HIV test',
    reporting_threshold: 20,
    reporting_timeframe: '30d',
    requires_lab_confirmation: true,
    contact_tracing_required: false,
  },
  
  // Other Priority Diseases
  {
    code: 'DENG',
    name: 'Dengue Fever',
    category: 'epidemic_prone',
    priority: 'medium',
    icd11_code: '1D2Z',
    symptoms: ['fever', 'headache', 'joint_pain', 'rash', 'bleeding'],
    case_definition: 'Acute febrile illness with headache and joint/muscle pain',
    reporting_threshold: 5,
    reporting_timeframe: '7d',
    requires_lab_confirmation: true,
    contact_tracing_required: false,
  },
  {
    code: 'TYPH',
    name: 'Typhoid Fever',
    category: 'endemic',
    priority: 'medium',
    icd11_code: '1A07',
    symptoms: ['fever', 'headache', 'abdominal_pain', 'constipation'],
    case_definition: 'Prolonged fever with headache and abdominal symptoms',
    reporting_threshold: 5,
    reporting_timeframe: '7d',
    requires_lab_confirmation: true,
    contact_tracing_required: false,
  },
  {
    code: 'RABIES',
    name: 'Rabies',
    category: 'other',
    priority: 'high',
    icd11_code: '1C82',
    symptoms: ['hydrophobia', 'altered_consciousness', 'paralysis', 'animal_bite'],
    case_definition: 'History of animal bite with neurological symptoms',
    reporting_threshold: 1,
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: false,
    contact_tracing_required: true,
  },
  {
    code: 'POLIO',
    name: 'Acute Flaccid Paralysis (AFP)',
    category: 'epidemic_prone',
    priority: 'high',
    icd11_code: '8C70',
    symptoms: ['paralysis', 'fever', 'weakness'],
    case_definition: 'Acute onset of flaccid paralysis in child under 15 years',
    reporting_threshold: 1,
    reporting_timeframe: 'immediate',
    requires_lab_confirmation: true,
    contact_tracing_required: false,
  },
];

export const SYMPTOM_OPTIONS = [
  { value: 'fever', label: 'Fever' },
  { value: 'cough', label: 'Cough' },
  { value: 'rash', label: 'Rash' },
  { value: 'diarrhea', label: 'Diarrhea' },
  { value: 'acute_watery_diarrhea', label: 'Acute Watery Diarrhea' },
  { value: 'vomiting', label: 'Vomiting' },
  { value: 'headache', label: 'Headache' },
  { value: 'breathing_difficulty', label: 'Difficulty Breathing' },
  { value: 'joint_pain', label: 'Joint Pain' },
  { value: 'muscle_pain', label: 'Muscle Pain' },
  { value: 'weakness', label: 'Weakness/Fatigue' },
  { value: 'bleeding', label: 'Bleeding' },
  { value: 'jaundice', label: 'Jaundice' },
  { value: 'dehydration', label: 'Dehydration' },
  { value: 'stiff_neck', label: 'Stiff Neck' },
  { value: 'altered_consciousness', label: 'Altered Consciousness' },
  { value: 'conjunctivitis', label: 'Red Eyes (Conjunctivitis)' },
  { value: 'loss_of_taste_smell', label: 'Loss of Taste or Smell' },
  { value: 'lymphadenopathy', label: 'Swollen Lymph Nodes' },
  { value: 'chills', label: 'Chills' },
  { value: 'sweating', label: 'Sweating' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'night_sweats', label: 'Night Sweats' },
  { value: 'abdominal_pain', label: 'Abdominal Pain' },
  { value: 'paralysis', label: 'Paralysis' },
  { value: 'hydrophobia', label: 'Fear of Water' },
  { value: 'animal_bite', label: 'Animal Bite' },
  { value: 'other', label: 'Other' },
];

export const AGE_GROUPS = [
  { value: '0-1', label: '0-1 year' },
  { value: '1-5', label: '1-5 years' },
  { value: '5-15', label: '5-15 years' },
  { value: '15-49', label: '15-49 years' },
  { value: '50+', label: '50+ years' },
];

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
  { value: 'U', label: 'Unknown' },
];

export const CASE_STATUS = [
  { value: 'suspected', label: 'Suspected', color: 'yellow' },
  { value: 'probable', label: 'Probable', color: 'orange' },
  { value: 'confirmed', label: 'Confirmed', color: 'red' },
  { value: 'recovered', label: 'Recovered', color: 'green' },
  { value: 'deceased', label: 'Deceased', color: 'black' },
  { value: 'closed', label: 'Closed', color: 'gray' },
];

export const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'critical', label: 'Critical' },
];

/**
 * Get disease by code
 */
export function getDiseaseByCode(code: string): DiseaseDefinition | undefined {
  return PRIORITY_DISEASES.find(d => d.code === code);
}

/**
 * Suggest diseases based on symptoms
 */
export function suggestDiseases(symptoms: string[]): DiseaseDefinition[] {
  if (symptoms.length === 0) return [];
  
  const scored = PRIORITY_DISEASES.map(disease => {
    const matchCount = symptoms.filter(s => disease.symptoms.includes(s)).length;
    const matchRatio = matchCount / disease.symptoms.length;
    return { disease, score: matchCount * matchRatio };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.disease);
}

/**
 * Check if case should trigger immediate alert
 */
export function shouldTriggerAlert(diseaseCode: string, caseCount: number, timeframeHours: number): boolean {
  const disease = getDiseaseByCode(diseaseCode);
  if (!disease) return false;
  
  if (disease.reporting_timeframe === 'immediate') {
    return caseCount >= disease.reporting_threshold;
  }
  
  // Parse timeframe
  const timeframeMap: Record<string, number> = {
    '24h': 24,
    '7d': 168,
    '30d': 720,
  };
  
  const diseaseTimeframe = timeframeMap[disease.reporting_timeframe];
  if (timeframeHours <= diseaseTimeframe) {
    return caseCount >= disease.reporting_threshold;
  }
  
  return false;
}

/**
 * Get priority diseases for dropdown
 */
export function getDiseasesForDropdown() {
  return PRIORITY_DISEASES.map(d => ({
    value: d.code,
    label: `${d.name} (${d.code})`,
    priority: d.priority,
  })).sort((a, b) => {
    // Sort by priority: high -> medium -> low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
