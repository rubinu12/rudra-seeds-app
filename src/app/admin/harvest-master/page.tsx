// src/app/admin/harvest-master/page.tsx
import { Suspense } from "react";
import HarvestMasterGrid from "@/src/components/admin/reports/HarvestMasterGrid";
import { Sprout } from "lucide-react";

// THIS LINE FIXES THE BUILD ERROR BY OPTING OUT OF STATIC PRERENDERING
export const dynamic = "force-dynamic"; 

export default function HarvestMasterPage() {
  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Sprout className="w-6 h-6" />
        </div>
        <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Harvest & Payment Ledger</h1>
            <p className="text-sm text-slate-500 mt-1">Complete breakdown of all lots, weights, and cheque details.</p>
        </div>
      </div>

      {/* Render the Grid */}
      <div className="flex-1 min-h-0">
         <Suspense fallback={
            <div className="flex items-center justify-center h-full text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
               Loading Ledger Application...
            </div>
         }>
            <HarvestMasterGrid />
         </Suspense>
      </div>

    </div>
  );
}