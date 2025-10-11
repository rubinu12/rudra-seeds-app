// src/app/admin/dashboard/page.tsx
import KeyMetrics from "@/components/admin/KeyMetrics";
import Sidebar from "@/components/admin/Sidebar";
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import { Search } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <>
      <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-full p-1 flex items-center">
        <Search className="mx-3 text-on-surface-variant" />
        <input type="text" placeholder="Search..." className="w-full bg-transparent focus:outline-none text-on-surface-variant placeholder:text-on-surface-variant" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WelcomeHeader />
          <KeyMetrics />
        </div>

        <div className="lg:col-span-1">
          <Sidebar />
        </div>
      </div>

      <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-2xl p-10 text-center text-on-surface-variant">
        What to put here not decided yet
      </div>
    </>
  );
}