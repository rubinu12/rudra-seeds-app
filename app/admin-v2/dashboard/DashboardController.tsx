"use client";

import { useAdmin } from "@/components/admin-v2/AdminProvider";
import { Suspense } from "react";
import HarvestView from "@/app/admin-v2/views/HarvestView";
// import SowingView from "./views/SowingView"; // Future
// import GrowingView from "./views/GrowingView"; // Future

export default function DashboardController() {
  const { mode, seasonLabel } = useAdmin();

  // Simple Loading State for Mode Switching
  const LoadingFallback = () => (
    <div className="h-96 w-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
        <div className="w-12 h-12 bg-slate-200 rounded-full mb-4" />
        <p>Loading {mode} Operations...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. Dynamic Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {mode} Overview
          </h1>
          <p className="text-lg text-slate-500 font-medium mt-2">
            Managing <span className="text-purple-600 font-bold">{seasonLabel}</span> crop cycle operations.
          </p>
        </div>
        
        {/* Context-Aware Global Actions can go here */}
        <div className="flex gap-4">
            <button className="px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm">
                Export Report
            </button>
            <button className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all">
                + Global Action
            </button>
        </div>
      </div>

      {/* 2. Mode Switcher Logic */}
      <Suspense fallback={<LoadingFallback />}>
        {mode === 'Harvesting' && <HarvestView />}
        
        {mode === 'Sowing' && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400">
                Sowing Dashboard Coming Soon
            </div>
        )}
        
        {mode === 'Growing' && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400">
                Growing Dashboard Coming Soon
            </div>
        )}
      </Suspense>

    </div>
  );
}