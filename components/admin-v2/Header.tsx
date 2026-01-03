"use client";

import { useAdmin } from "./AdminProvider";
import { Search, Bell, RefreshCw, Calendar, ChevronDown, Sprout, Tractor, Scissors } from "lucide-react";

export default function Header() {
  const { season, setSeason, mode, setMode, loading, refreshData } = useAdmin();

  const MODES = [
    { id: 'Sowing', icon: Sprout, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'Growing', icon: Tractor, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Harvesting', icon: Scissors, color: 'text-orange-600', bg: 'bg-orange-50' },
  ] as const;

  return (
    <header className="h-24 px-8 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      
      {/* Left: Search & Breadcrumbs */}
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search farmers, lots, or shipments..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-700 font-medium focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        
        {/* 1. Mode Selector (M3 Segmented Button Style) */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300
                ${mode === m.id 
                  ? "bg-white text-slate-800 shadow-sm scale-100" 
                  : "text-slate-400 hover:text-slate-600 scale-95"}`}
            >
              <m.icon className={`w-4 h-4 ${mode === m.id ? m.color : ""}`} />
              <span className="hidden xl:inline">{m.id}</span>
            </button>
          ))}
        </div>

        {/* 2. Season Selector (The "Bridge") */}
        <div className="relative group">
            <button className="flex items-center gap-3 bg-purple-50 hover:bg-purple-100 text-purple-900 px-5 py-3 rounded-2xl transition-colors">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-sm tracking-wide">{season}-{season+1}</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
            </button>
            
            {/* Dropdown (Absolute) */}
            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                {[2026, 2025, 2024].map((yr) => (
                    <button 
                        key={yr}
                        onClick={() => setSeason(yr)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors
                            ${season === yr ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                        Season {yr}-{yr+1}
                    </button>
                ))}
            </div>
        </div>

        {/* 3. Refresh Action */}
        <button 
            onClick={refreshData}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-all active:scale-95 ${loading ? "animate-spin text-purple-600 border-purple-200" : ""}`}
        >
            <RefreshCw className="w-5 h-5" />
        </button>

        {/* 4. User Profile */}
        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200 cursor-pointer hover:scale-105 transition-transform">
            JD
        </div>
      </div>
    </header>
  );
}