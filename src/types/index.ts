export interface User {
  id: string;
  name: string;
  mobile: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  first_login: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  student_name: string;
  class: string;
  parent_phone: string;
  address: string;
  house_name: string;
  remarks: string;
  photo_url: string;
  added_by: string;
  year: string;
  created_at: string;
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  category: string;
  payment_method: string;
  remarks: string;
  year: string;
  created_by: string;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  payment_method: string;
  bill_url: string;
  remarks: string;
  year: string;
  created_by: string;
  created_at: string;
}

export interface Settings {
  default_year: string;
  app_name: string;
  income_categories?: string[];
  expense_categories?: string[];
  updated_at: string;
}

export interface Year {
  id: string;
  year_name: string;
  is_default: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: 'admin' | 'user';
  first_login: boolean;
}

export type FinanceType = 'income' | 'expenses';

export const CLASS_OPTIONS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  'Plus One', 'Plus Two'
];

export const INCOME_CATEGORIES = [
  'Membership Fee', 'Donation', 'Event Income', 'Programme Fee', 'Other'
];

export const EXPENSE_CATEGORIES = [
  'Event Expense', 'Office Supply', 'Travel', 'Food', 'Printing', 'Other'
];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
