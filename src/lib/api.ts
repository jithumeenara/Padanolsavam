import { getCache, setCache, bustCache } from './cache';

const BASE_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

async function apiFetch<T = unknown>(
  action: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!BASE_URL) throw new Error('Apps Script URL not configured. Set NEXT_PUBLIC_APPS_SCRIPT_URL in .env.local');

  let url = BASE_URL;
  const options: RequestInit = { method, redirect: 'follow' };

  if (method === 'GET') {
    const params = new URLSearchParams({ action });
    if (body) {
      Object.entries(body).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
    }
    url = `${BASE_URL}?${params.toString()}`;
  } else {
    options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    options.body = JSON.stringify({ action, ...body });
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Network error — check your internet connection');
  }

  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error('Invalid response from server');
  }

  if (!json.success) throw new Error(json.message || 'API Error');
  return json.data as T;
}

// ---- Auth ----
export const login = (mobile: string, password: string) =>
  apiFetch<{ id: string; name: string; mobile: string; role: string; first_login: boolean }>(
    'login', 'POST', { mobile, password }
  );

export const changePassword = (id: string, newPassword: string) =>
  apiFetch('changePassword', 'POST', { id, newPassword });

// ---- Users ----
export const getUsers = async (): Promise<import('@/types').User[]> => {
  const key = 'users';
  const cached = getCache<import('@/types').User[]>(key);
  if (cached) return cached;
  const data = await apiFetch<import('@/types').User[]>('getUsers', 'GET');
  setCache(key, data);
  return data;
};

export const addUser = (name: string, mobile: string, role: string) => {
  bustCache('users');
  return apiFetch('addUser', 'POST', { name, mobile, role });
};

export const updateUser = (id: string, updates: Record<string, string>) => {
  bustCache('users');
  return apiFetch('updateUser', 'POST', { id, ...updates });
};

export const toggleUser = (id: string) => {
  bustCache('users');
  return apiFetch<{ status: string }>('toggleUser', 'POST', { id });
};

// ---- Students ----
export const getStudents = async (year: string, added_by?: string): Promise<import('@/types').Student[]> => {
  const key = `students:${year}:${added_by || ''}`;
  const cached = getCache<import('@/types').Student[]>(key);
  if (cached) return cached;
  const data = await apiFetch<import('@/types').Student[]>('getStudents', 'GET', { year, added_by });
  setCache(key, data);
  return data;
};

export const addStudent = (data: Record<string, string>) => {
  bustCache('students:');
  return apiFetch<{ id: string }>('addStudent', 'POST', data);
};

export const updateStudent = (id: string, data: Record<string, string>) => {
  bustCache('students:');
  return apiFetch('updateStudent', 'POST', { id, ...data });
};

export const deleteStudent = (id: string) => {
  bustCache('students:');
  return apiFetch('deleteStudent', 'POST', { id });
};

// ---- Finance ----
export const getFinance = async (type: 'income' | 'expenses', year: string): Promise<(import('@/types').Income | import('@/types').Expense)[]> => {
  const key = `finance:${type}:${year}`;
  const cached = getCache<(import('@/types').Income | import('@/types').Expense)[]>(key);
  if (cached) return cached;
  const data = await apiFetch<(import('@/types').Income | import('@/types').Expense)[]>('getFinance', 'GET', { type, year });
  setCache(key, data);
  return data;
};

export const addIncome = (data: Record<string, unknown>) => {
  bustCache('finance:income:');
  return apiFetch<{ id: string }>('addIncome', 'POST', data);
};

export const addExpense = (data: Record<string, unknown>) => {
  bustCache('finance:expenses:');
  return apiFetch<{ id: string }>('addExpense', 'POST', data);
};

// ---- Upload ----
export const uploadFile = (base64: string, fileName: string, mimeType: string) =>
  apiFetch<{ url: string; fileId: string }>('uploadFile', 'POST', { data: base64, fileName, mimeType });

// ---- Settings ----
export const getSettings = async (): Promise<{ settings: import('@/types').Settings; years: import('@/types').Year[] }> => {
  const key = 'settings';
  const cached = getCache<{ settings: import('@/types').Settings; years: import('@/types').Year[] }>(key);
  if (cached) return cached;
  const data = await apiFetch<{ settings: import('@/types').Settings; years: import('@/types').Year[] }>('getSettings', 'GET');
  setCache(key, data);
  return data;
};

export const updateSettings = (data: Record<string, string>) => {
  bustCache('settings');
  return apiFetch('updateSettings', 'POST', data);
};

export const addYear = (year_name: string) => {
  bustCache('settings');
  return apiFetch<{ id: string }>('addYear', 'POST', { year_name });
};
