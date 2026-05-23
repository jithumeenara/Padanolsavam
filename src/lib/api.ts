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
  let url = `${BASE_URL}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
  };

  if (method === 'GET') {
    const params = new URLSearchParams({ action });
    if (body) {
      Object.entries(body).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    url = `${BASE_URL}?${params.toString()}`;
  } else {
    options.body = JSON.stringify({ action, ...body });
  }

  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();
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
export const getUsers = () =>
  apiFetch<import('@/types').User[]>('getUsers', 'GET');

export const addUser = (name: string, mobile: string, role: string) =>
  apiFetch('addUser', 'POST', { name, mobile, role });

export const updateUser = (id: string, updates: Record<string, string>) =>
  apiFetch('updateUser', 'POST', { id, ...updates });

export const toggleUser = (id: string) =>
  apiFetch<{ status: string }>('toggleUser', 'POST', { id });

// ---- Students ----
export const getStudents = (year: string, added_by?: string) =>
  apiFetch<import('@/types').Student[]>('getStudents', 'GET', { year, added_by });

export const addStudent = (data: Record<string, string>) =>
  apiFetch<{ id: string }>('addStudent', 'POST', data);

export const updateStudent = (id: string, data: Record<string, string>) =>
  apiFetch('updateStudent', 'POST', { id, ...data });

export const deleteStudent = (id: string) =>
  apiFetch('deleteStudent', 'POST', { id });

// ---- Finance ----
export const getFinance = (type: 'income' | 'expenses', year: string) =>
  apiFetch<(import('@/types').Income | import('@/types').Expense)[]>('getFinance', 'GET', { type, year });

export const addIncome = (data: Record<string, unknown>) =>
  apiFetch<{ id: string }>('addIncome', 'POST', data);

export const addExpense = (data: Record<string, unknown>) =>
  apiFetch<{ id: string }>('addExpense', 'POST', data);

// ---- Upload ----
export const uploadFile = (base64: string, fileName: string, mimeType: string) =>
  apiFetch<{ url: string; fileId: string }>('uploadFile', 'POST', { data: base64, fileName, mimeType });

// ---- Settings ----
export const getSettings = () =>
  apiFetch<{ settings: import('@/types').Settings; years: import('@/types').Year[] }>('getSettings', 'GET');

export const updateSettings = (data: Record<string, string>) =>
  apiFetch('updateSettings', 'POST', data);

export const addYear = (year_name: string) =>
  apiFetch<{ id: string }>('addYear', 'POST', { year_name });
