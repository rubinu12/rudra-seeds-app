import { Phone, ArrowRight } from "lucide-react";
import { MODERN_THEMES } from "@/app/employee-v2/theme";

export default function ModernCard({ data, location }: any) {
  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden group">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 leading-tight">
            {data.name}
          </h3>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {data.village} • {data.landmark}
          </p>
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
        <span
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${theme.accent} ${theme.text} ${theme.border}`}
        >
          {data.bags} Bags
        </span>
      </div>

      {/* Action Area - The Redesign */}
      {/* Instead of a full block, we use a sleek floating-style button aligned right */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
          Ready to Load
        </span>

        <button
          className={`pl-5 pr-4 py-3 rounded-xl flex items-center gap-3 font-bold text-sm transition-transform active:scale-95 ${theme.button}`}
        >
          Add to Shipment
          <ArrowRight className="w-4 h-4 opacity-80" />
        </button>
      </div>
    </div>
  );
}
