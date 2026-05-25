import { getCache, setCache, bustCache } from './cache';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

async function apiFetch<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  let url = path;
  const options: RequestInit = { method };

  if (method === 'GET' && body) {
    const params = new URLSearchParams();
    Object.entries(body).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    url = `${path}?${params.toString()}`;
  } else if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Network error — check your internet connection');
  }

  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || 'Error');
  return json.data as T;
}

// ---- Auth ----
export const login = (mobile: string, password: string) =>
  apiFetch<{ id: string; name: string; mobile: string; role: string; first_login: boolean }>(
    '/api/auth/login', 'POST', { mobile, password }
  );

export const changePassword = (id: string, newPassword: string) =>
  apiFetch('/api/auth/change-password', 'POST', { id, newPassword });

// ---- Users ----
export const getUsers = async (): Promise<import('@/types').User[]> => {
  const key = 'users';
  const cached = getCache<import('@/types').User[]>(key);
  if (cached) return cached;
  const data = await apiFetch<import('@/types').User[]>('/api/users');
  setCache(key, data);
  return data;
};

export const addUser = (name: string, mobile: string, role: string) => {
  bustCache('users');
  return apiFetch('/api/users', 'POST', { name, mobile, role });
};

export const updateUser = (id: string, updates: Record<string, string>) => {
  bustCache('users');
  return apiFetch(`/api/users/${id}`, 'PUT', updates as Record<string, unknown>);
};

export const toggleUser = (id: string) => {
  bustCache('users');
  return apiFetch<{ status: string }>(`/api/users/${id}`, 'PATCH');
};

// ---- Students ----
export const getStudents = async (year: string, added_by?: string): Promise<import('@/types').Student[]> => {
  const key = `students:${year}:${added_by || ''}`;
  const cached = getCache<import('@/types').Student[]>(key);
  if (cached) return cached;
  const data = await apiFetch<import('@/types').Student[]>('/api/students', 'GET', { year, added_by });
  setCache(key, data);
  return data;
};

export const addStudent = (data: Record<string, string>) => {
  bustCache('students:');
  return apiFetch<{ id: string }>('/api/students', 'POST', data);
};

export const updateStudent = (id: string, data: Record<string, string>) => {
  bustCache('students:');
  return apiFetch(`/api/students/${id}`, 'PUT', data as Record<string, unknown>);
};

export const deleteStudent = (id: string) => {
  bustCache('students:');
  return apiFetch(`/api/students/${id}`, 'DELETE');
};

// ---- Finance ----
export const getFinance = async (type: 'income' | 'expenses', year: string): Promise<(import('@/types').Income | import('@/types').Expense)[]> => {
  const key = `finance:${type}:${year}`;
  const cached = getCache<(import('@/types').Income | import('@/types').Expense)[]>(key);
  if (cached) return cached;
  const data = await apiFetch<(import('@/types').Income | import('@/types').Expense)[]>('/api/finance', 'GET', { type, year });
  setCache(key, data);
  return data;
};

export const addIncome = (data: Record<string, unknown>) => {
  bustCache('finance:income:');
  return apiFetch<{ id: string }>('/api/finance/income', 'POST', data);
};

export const addExpense = (data: Record<string, unknown>) => {
  bustCache('finance:expenses:');
  return apiFetch<{ id: string }>('/api/finance/expenses', 'POST', data);
};

// ---- Upload ----
export const uploadFile = (base64: string, _fileName: string, mimeType: string) =>
  apiFetch<{ url: string; fileId: string }>('/api/upload', 'POST', { data: base64, mimeType });

// ---- Settings ----
export const getSettings = async (): Promise<{ settings: import('@/types').Settings; years: import('@/types').Year[] }> => {
  const key = 'settings';
  const cached = getCache<{ settings: import('@/types').Settings; years: import('@/types').Year[] }>(key);
  if (cached) return cached;
  const data = await apiFetch<{ settings: import('@/types').Settings; years: import('@/types').Year[] }>('/api/settings');
  setCache(key, data);
  return data;
};

export const updateSettings = (data: Record<string, unknown>) => {
  bustCache('settings');
  return apiFetch('/api/settings', 'PUT', data);
};

export const addYear = (year_name: string) => {
  bustCache('settings');
  return apiFetch<{ id: string }>('/api/years', 'POST', { year_name });
};
