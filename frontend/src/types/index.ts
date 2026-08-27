export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
}

export interface LeadCreatePayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
}

export interface LeadUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
}

export type ClassificationType = 'HOT' | 'WARM' | 'COLD';

export interface LeadQualification {
  id: number;
  lead_id: number;
  score: number;
  classification: ClassificationType | string;
  summary: string;
  recommended_action: string;
  ai_provider: string;
  ai_model: string;
  created_at: string;
}

export interface LeadWithLatestQualification extends Lead {
  latestQualification?: LeadQualification | null;
  qualificationsHistory?: LeadQualification[];
}

export type NavigationView = 'dashboard' | 'leads' | 'qualify' | 'history' | 'automation' | 'settings';

export interface MetricsSummary {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  unqualifiedLeads: number;
  averageScore: number;
  qualificationRate: number;
}
