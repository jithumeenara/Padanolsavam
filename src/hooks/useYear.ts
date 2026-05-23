'use client';
import { create } from 'zustand';

interface YearStore {
  activeYear: string;
  setActiveYear: (year: string) => void;
}

export const useYear = create<YearStore>((set) => ({
  activeYear: typeof window !== 'undefined'
    ? localStorage.getItem('dyfi_year') || ''
    : '',
  setActiveYear: (year) => {
    if (typeof window !== 'undefined') localStorage.setItem('dyfi_year', year);
    set({ activeYear: year });
  },
}));
