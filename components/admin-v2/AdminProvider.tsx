"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Define Modes & Types
export type AppMode = 'Sowing' | 'Growing' | 'Harvesting';

type AdminContextType = {
  season: number; // DB Value (e.g., 2025)
  seasonLabel: string; // Display Value (e.g., "2025-26")
  setSeason: (year: number) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Default to current year logic
  const [season, setSeason] = useState<number>(new Date().getFullYear());
  const [mode, setMode] = useState<AppMode>('Harvesting');
  const [loading, setLoading] = useState(false);

  // Derived State for Display (The "Bridge")
  const seasonLabel = `${season}-${(season + 1).toString().slice(-2)}`;

  const refreshData = async () => {
    setLoading(true);
    // Simulate Fetch for now (We will connect real actions later)
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    toast.success("Dashboard Updated");
  };

  return (
    <AdminContext.Provider value={{ 
        season, seasonLabel, setSeason, 
        mode, setMode, 
        loading, refreshData 
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
};