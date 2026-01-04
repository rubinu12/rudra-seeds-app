"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type AppMode = 'Sowing' | 'Growing' | 'Harvesting';

type AdminContextType = {
  year: number;           // e.g., 2025
  seasonLabel: string;    // e.g., "2025-26"
  mode: AppMode;
  setYear: (year: number) => void;
  setMode: (mode: AppMode) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Get Values from URL or Default
  const year = Number(searchParams.get('year')) || new Date().getFullYear();
  const mode = (searchParams.get('mode') as AppMode) || 'Harvesting';

  // 2. Generate the "2025-26" Label
  const seasonLabel = useMemo(() => {
    const nextYearShort = (year + 1).toString().slice(-2);
    return `${year}-${nextYearShort}`;
  }, [year]);

  // 3. Update URL when state changes
  const updateParams = (newYear: number, newMode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', newYear.toString());
    params.set('mode', newMode);
    router.push(`?${params.toString()}`);
  };

  const setYear = (y: number) => updateParams(y, mode);
  const setMode = (m: AppMode) => updateParams(year, m);

  return (
    <AdminContext.Provider value={{ year, seasonLabel, mode, setYear, setMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
};