"use client";

import { useAdmin } from "@/src/components/admin/AdminProvider";
import Navbar from "@/src/components/admin/Navbar";
import Sidebar from "@/src/components/admin/Sidebar";
import HarvestView from "../views/HarvestView";
import SowingView from "../views/SowingView"; // New Import

export default function DashboardController() {
  const { mode, setMode } = useAdmin();

  return (
    <div className="flex flex-col h-full">
      {/* 1. Navbar: Controls the 'mode' state */}
      <Navbar activeSeason={mode} onSeasonChange={(m) => setMode(m as any)} />

      {/* 2. Responsive Grid Layout */}
      <main className="max-w-screen-xl mx-auto w-full p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Workspace (Left - 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {mode === "Harvesting" && <HarvestView />}

            {mode === "Sowing" && <SowingView />}

            {mode === "Growing" && (
              <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center text-gray-400">
                Growing Mode is currently under development.
              </div>
            )}
          </div>

          {/* Right-side Operational Sidebar (Right - 1/3) */}
          <div className="lg:col-span-1 sticky top-6">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
