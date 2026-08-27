import type {
  AuthTokens,
  Lead,
  LeadCreatePayload,
  LeadQualification,
  LeadUpdatePayload,
  User,
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
const API_BASE = envApiUrl ? `${envApiUrl}/api/v1` : '/api/v1';
const TOKEN_KEY = 'leadflow_auth_token';
const USER_KEY = 'leadflow_auth_user';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  public getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setStoredUser(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, config);
    } catch (err: any) {
      throw new ApiError(
        'Unable to connect to the LeadFlowAI backend service. Please ensure the server is running.',
        0
      );
    }

    if (response.status === 401) {
      // Token expired or invalid
      if (this.token && !endpoint.includes('/auth/login')) {
        this.setToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      let message = 'An unexpected error occurred';
      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        }
      } else if (typeof data === 'string' && data.length > 0) {
        message = data;
      }
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  }

  // System
  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Auth
  async register(name: string, email: string, password: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const tokens = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    this.setToken(tokens.access_token);
    return tokens;
  }

  logout(): void {
    this.setToken(null);
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/leads/');
  }

  async getLead(id: number): Promise<Lead> {
    return this.request<Lead>(`/leads/${id}`);
  }

  async createLead(payload: LeadCreatePayload): Promise<Lead> {
    return this.request<Lead>('/leads/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async updateLead(id: number, payload: LeadUpdatePayload): Promise<Lead> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async deleteLead(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Qualification
  async qualifyLead(id: number): Promise<LeadQualification> {
    return this.request<LeadQualification>(`/leads/${id}/qualify`, {
      method: 'POST',
    });
  }

  async getQualifications(id: number): Promise<LeadQualification[]> {
    return this.request<LeadQualification[]>(`/leads/${id}/qualifications`);
  }
}

export const api = new ApiClient();
