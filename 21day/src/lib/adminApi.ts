import { API_BASE_URL } from './api';

const TOKEN_KEY = 'fitino_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class AdminUnauthorizedError extends Error {}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearAdminToken();
    throw new AdminUnauthorizedError('نشست شما منقضی شده است');
  }
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export interface AdminFunnelStage {
  stage: string;
  video_id?: number;
  count?: number;
  reached?: number;
  completed?: number;
}

export interface AdminStats {
  total_registrations: number;
  registrations_today: number;
  registrations_week: number;
  registrations_by_day: { date: string; count: number }[];
  total_videos: number;
  engaged_users: number;
  not_started_users: number;
  completed_all_users: number;
  engagement_rate: number;
  completion_rate: number;
  avg_progress_percent: number;
  funnel: AdminFunnelStage[];
}

export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string | null;
  completed_videos: number;
  unlocked_videos: number;
  total_videos: number;
  progress_percent: number;
  total_points: number;
  level: number;
  last_activity: string | null;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

export const adminApi = {
  async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }
    const data = await res.json();
    setAdminToken(data.token);
  },

  async logout(): Promise<void> {
    try {
      await adminRequest('/admin/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout, still clear local token
    } finally {
      clearAdminToken();
    }
  },

  getStats(): Promise<AdminStats> {
    return adminRequest<AdminStats>('/admin/stats');
  },

  getUsers(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<AdminUsersResponse> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('page_size', String(params.pageSize));
    if (params.search) q.set('search', params.search);
    return adminRequest<AdminUsersResponse>(`/admin/users?${q.toString()}`);
  },

  async downloadUsersCsv(): Promise<void> {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE_URL}/admin/users/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      clearAdminToken();
      throw new AdminUnauthorizedError('نشست شما منقضی شده است');
    }
    if (!res.ok) {
      throw new Error('خروجی گرفتن ناموفق بود');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitino-21day-users.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
