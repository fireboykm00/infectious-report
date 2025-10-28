export const ROLES = [
  { id: 'reporter', label: 'Reporter' },
  { id: 'lab_tech', label: 'Lab Technician' },
  { id: 'district_officer', label: 'District Officer' },
  { id: 'national_officer', label: 'National Officer' },
  { id: 'admin', label: 'Administrator' },
] as const;

export type UserRole = (typeof ROLES)[number]['id'];

export interface AuthFormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: Profile | null;
  loading: boolean;
}