"use client";

import { Phone, ArrowRight, MapPin } from "lucide-react";
import { MODERN_THEMES } from "@/src/app/employee/theme";

// Defined interface for type safety
export interface ModernCardData {
  id: number;
  name: string;
  village: string;
  landmark?: string | null;
  seed: string;
  color_code?: string; // Needed for the "Color Coded Strip"
  badgeText?: string;  // Optional badge (e.g., "20 Bags")
  status?: string;
  mobile_number?: string | null;
}

interface ModernCardProps {
  data: ModernCardData;
  location: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export default function ModernCard({
  data,
  location,
  onAction,
  actionLabel = "View Details",
  icon,
}: ModernCardProps) {
  // Fallback to Farm theme if location doesn't match
  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  // 1. DYNAMIC COLOR STRIP LOGIC
  // Uses the seed's color code for branding, defaults to slate if missing
  const seedColor = data.color_code || "#64748b"; 
  
  const dynamicStyle = {
    borderLeft: `5px solid ${seedColor}`,
    // Subtle gradient fade from the seed color
    background: `linear-gradient(to right, ${seedColor}08, #ffffff 40%)`,
  };

  return (
    <div 
      className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden group mb-4 transition-all hover:shadow-md"
      style={dynamicStyle}
    >
      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 leading-tight">
            {data.name}
          </h3>
          <div className="flex items-center gap-1 text-sm text-slate-400 font-medium mt-1">
            <span>{data.village}</span>
            {data.landmark && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {data.landmark}
                </span>
              </>
            )}
          </div>
        </div>
        
        {data.mobile_number && (
          <a 
            href={`tel:${data.mobile_number}`}
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors bg-white shadow-sm"
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Info Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Seed Pill - Colored by Seed Type */}
        <span 
            className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide shadow-sm"
            style={{
                backgroundColor: `${seedColor}15`,
                color: seedColor,
                borderColor: `${seedColor}30`,
            }}
        >
          {data.seed}
        </span>

        {/* Badge (e.g. Quantity) - Uses Theme Colors */}
        {data.badgeText && (
          <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${theme.pill}`}>
            {data.badgeText}
          </span>
        )}

        {/* Status Pill (if provided) */}
        {data.status && (
          <span className="px-3 py-1.5 rounded-lg border border-purple-100 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wide">
            {data.status}
          </span>
        )}
      </div>

      {/* Action Area */}
      {onAction && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            {icon || "Action Required"}
            </span>

            <button
            onClick={onAction}
            className={`pl-5 pr-4 py-3 rounded-xl flex items-center gap-3 font-bold text-sm transition-transform active:scale-95 ${theme.btn}`}
            >
            {actionLabel}
            <ArrowRight className="w-4 h-4 opacity-80" />
            </button>
        </div>
      )}
    </div>
  );
}