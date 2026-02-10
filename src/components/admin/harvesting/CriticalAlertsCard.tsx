// components/admin/harvesting/CriticalAlertsCard.tsx
"use client";

import { CriticalAlertsData } from "@/src/lib/admin-data"; // Import the type
import { AlertTriangle, Timer, Package } from "lucide-react";

type Props = {
  data: CriticalAlertsData;
  // We can add onClick handlers later to open modals
  // onOverdueWeighingClick: () => void;
  // onPendingLoadingClick: () => void;
};

export default function CriticalAlertsCard({ data }: Props) {
  return (
    <div className="bg-error-container rounded-3xl p-6 shadow-sm relative text-on-error-container">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-medium">Critical Alerts</h3>
          <p className="text-sm opacity-90">Immediate attention needed</p>
        </div>
        <AlertTriangle className="w-6 h-6 text-error flex-shrink-0" />
      </div>

      <div className="grid grid-cols-1 gap-5 mt-6">
        {/* Overdue Weighing Alert */}
        <button
          // onClick={onOverdueWeighingClick} // Add later
          className="flex items-center gap-3 p-4 rounded-xl bg-error/20 hover:bg-error/30 transition-colors w-full text-left"
        >
          <Timer
            className="w-6 h-6 text-error flex-shrink-0"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-2xl font-semibold">
              {data.pricedOver12DaysNotWeighed}
            </p>
            <p className="text-xs font-medium">
              Priced 12 days, Weighing Pending
            </p>
          </div>
        </button>

        {/* Pending Loading Alert */}
        <button
          // onClick={onPendingLoadingClick} // Add later
          className="flex items-center gap-3 p-4 rounded-xl bg-error/20 hover:bg-error/30 transition-colors w-full text-left"
        >
          <Package
            className="w-6 h-6 text-error flex-shrink-0"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-2xl font-semibold">{data.weighedNotLoaded}</p>
            <p className="text-xs font-medium">Weighed, Loading Pending</p>
          </div>
        </button>
      </div>
    </div>
  );
}
