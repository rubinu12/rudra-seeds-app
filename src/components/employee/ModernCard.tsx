import { Phone, ArrowRight, MapPin, Scale } from "lucide-react";
import { MODERN_THEMES } from "@/src/app/employee/theme";

// Defined interface for type safety
interface CardData {
  id: number;
  name: string;
  village: string;
  landmark?: string;
  seed: string;
  badgeText?: string; // Optional badge (e.g., "20 Bags")
  status?: string;
}

interface ModernCardProps {
  data: CardData;
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
  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden group">
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
        <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
          <Phone className="w-4 h-4" />
        </button>
      </div>

      {/* Info Pills */}
      <div className="flex gap-2 mb-6">
        <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wide">
          {data.seed}
        </span>

        {/* Only show badge if data exists */}
        {data.badgeText && (
          <span
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${theme.accent} ${theme.text} ${theme.border}`}
          >
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
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          {icon || "Action Required"}
        </span>

        <button
          onClick={onAction}
          className={`pl-5 pr-4 py-3 rounded-xl flex items-center gap-3 font-bold text-sm transition-transform active:scale-95 ${theme.button}`}
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4 opacity-80" />
        </button>
      </div>
    </div>
  );
}
