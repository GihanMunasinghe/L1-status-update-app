export interface IssueReport {
  id: number;
  reporterName: string;
  systemName: string;
  issueDescription: string;
  suggestedSolution: string;
  status: "open" | "in_progress" | "resolved";
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: number;
  eventType: string;
  details: string;
  createdAt: string;
}

export interface SystemStats {
  systemName: string;
  count: number;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  thisWeek: number;
  bySystem: SystemStats[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/admin`
  : '/api/admin';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('admin_token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = import.meta.env.BASE_URL + 'login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'API request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  login: (data: any) => fetchWithAuth('/login', { method: 'POST', body: JSON.stringify(data) }),
  
  getStats: (): Promise<DashboardStats> => fetchWithAuth('/stats'),
  
  getReports: (status?: string): Promise<IssueReport[]> => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return fetchWithAuth(`/reports${query}`);
  },
  
  updateReport: (id: number, data: { status: string; adminNote?: string }): Promise<IssueReport> => 
    fetchWithAuth(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    
  deleteReport: (id: number): Promise<void> => fetchWithAuth(`/reports/${id}`, { method: 'DELETE' }),
  
  getActivity: (): Promise<ActivityLog[]> => fetchWithAuth('/activity'),
};
