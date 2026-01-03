"use client";

import { useState } from 'react';
import Navbar, { Season } from '@/components/admin/Navbar';
import HarvestView from '../views/HarvestView';

// Simple Controller for Season Switching ONLY
export default function DashboardController() {
  const [activeSeason, setActiveSeason] = useState<Season>('Harvesting');

  return (
    <>
      {/* 1. Navigation Bar (Handles Season Switch) */}
      <Navbar 
         activeSeason={activeSeason} 
         onSeasonChange={setActiveSeason} 
      />

      {/* 2. Main Content Area */}
      <main className="max-w-screen-xl mx-auto p-6 md:p-8">
         
         {/* Render View Based on Season */}
         {activeSeason === 'Harvesting' && <HarvestView />}
         
         {activeSeason === 'Sowing' && (
            <div className="p-10 text-center text-slate-400">Sowing View (Coming Soon)</div>
         )}
         
         {activeSeason === 'Growing' && (
            <div className="p-10 text-center text-slate-400">Growing View (Coming Soon)</div>
         )}

      </main>
    </>
  );
}