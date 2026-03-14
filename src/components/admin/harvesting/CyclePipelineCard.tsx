// components/admin/harvesting/CyclePipelineCard.tsx
"use client";

import { useState } from "react";
import { CyclePipelineStatus } from "@/src/lib/admin-data";
import {
  ArrowRightCircle,
  Package,
  ThumbsUp,
  Scale,
  ClipboardCheck,
} from "lucide-react";

// NEW: Import our modal
import WeighedMetricsModal from "./WeighedMetricsModal"; 

type Props = {
  data: CyclePipelineStatus;
};

type ViewMode = "total" | "last24Hours";

export default function CyclePipelineCard({ data }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("total");
  // NEW: State to control the modal
  const [isWeighedModalOpen, setIsWeighedModalOpen] = useState(false);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "total" ? "last24Hours" : "total"));
  };

  const currentData = data[viewMode];
  const title = viewMode === "total" ? "Total Cycles" : "Last 24 Hours";

  return (
    <div className="bg-surface-container rounded-3xl p-6 shadow-sm relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-medium text-on-surface">
            Pipeline Status
          </h3>
          <p className="text-sm text-on-surface-variant">{title}</p>
        </div>
        <button
          onClick={toggleViewMode}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-on-surface/10 transition-colors text-on-surface-variant"
          aria-label="Toggle time frame"
        >
          <ArrowRightCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 mt-6">
        <PipelineItem
          icon={ThumbsUp}
          label="Harvested"
          value={currentData.harvested}
          color="text-blue-500"
        />
        <PipelineItem
          icon={ClipboardCheck}
          label="Sampled"
          value={currentData.sampled}
          color="text-purple-500"
        />
        <PipelineItem
          icon={Package}
          label="Priced"
          value={currentData.priced}
          color="text-amber-500"
        />
        {/* NEW: Passed the onClick handler to the Weighed item */}
        <PipelineItem
          icon={Scale}
          label="Weighed"
          value={currentData.weighed}
          color="text-teal-500"
          onClick={() => setIsWeighedModalOpen(true)}
        />
      </div>

      {/* NEW: Mount the modal */}
      <WeighedMetricsModal 
        isOpen={isWeighedModalOpen} 
        onClose={() => setIsWeighedModalOpen(false)} 
      />
    </div>
  );
}

// Small helper component for each status item
// NEW: Added optional onClick prop and dynamic styling for interactivity
const PipelineItem = ({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 ${
      onClick 
        ? "cursor-pointer hover:bg-on-surface/5 p-2 -m-2 rounded-2xl transition-all border border-transparent hover:border-on-surface/10" 
        : ""
    }`}
  >
    <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.5} />
    <div>
      <p className="text-2xl font-semibold text-on-surface">{value}</p>
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
    </div>
  </div>
);