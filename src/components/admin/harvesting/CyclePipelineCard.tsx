// components/admin/harvesting/CyclePipelineCard.tsx
"use client";

import { useState } from "react";
import { CyclePipelineStatus } from "@/src/lib/admin-data"; // Import the type
import {
  ArrowRightCircle,
  Package,
  ThumbsUp,
  Scale,
  ClipboardCheck,
} from "lucide-react";

type Props = {
  data: CyclePipelineStatus;
};

type ViewMode = "total" | "last24Hours";

export default function CyclePipelineCard({ data }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("total");

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
        <PipelineItem
          icon={Scale}
          label="Weighed"
          value={currentData.weighed}
          color="text-teal-500"
        />
      </div>
    </div>
  );
}

// Small helper component for each status item
const PipelineItem = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="flex items-center gap-3">
    <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.5} />
    <div>
      <p className="text-2xl font-semibold text-on-surface">{value}</p>
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
    </div>
  </div>
);
