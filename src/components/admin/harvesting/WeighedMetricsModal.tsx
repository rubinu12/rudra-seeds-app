"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/src/components/ui/Modal";
import { 
  User, 
  Wheat, 
  Package, 
  LoaderCircle, 
  Save, 
  CheckCircle,
  Tag
} from "lucide-react";
import { 
  getWeighedCyclesWithLots, 
  updateCycleLotWeights, 
  WeighedCycleDetail 
} from "@/src/app/admin/actions/metrics-actions";

type WeighedMetricsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WeighedMetricsModal({
  isOpen,
  onClose,
}: WeighedMetricsModalProps) {
  const [cycles, setCycles] = useState<WeighedCycleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // --- THE HIDDEN DEVELOPER SIGNATURE (Console) ---
      console.log(
        "%c 🌱 Architected & Engineered by Root & Rise Developers %c\n For RudraSeeds ERP ", 
        "background: #0f172a; color: #10b981; font-size: 14px; font-weight: bold; border-radius: 6px 0 0 6px; padding: 6px;",
        "background: #10b981; color: #0f172a; font-size: 14px; font-weight: bold; border-radius: 0 6px 6px 0; padding: 6px;"
      );
      // ------------------------------------------------

      setIsLoading(true);
      getWeighedCyclesWithLots().then((data) => {
        setCycles(data);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Weighed Stock Distribution"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3 relative pb-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
            <p className="ml-2 text-on-surface-variant">
              Retrieving stock data...
            </p>
          </div>
        ) : cycles.length > 0 ? (
          cycles.map((cycle) => (
            <CycleEditorRow key={cycle.crop_cycle_id} cycle={cycle} />
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">
            No cycles currently in &apos;Weighed&apos; status.
          </p>
        )}

        {/* --- THE HIDDEN UI EASTER EGG --- */}
        <div className="absolute -bottom-2 right-0 opacity-0 hover:opacity-100 transition-opacity duration-700 cursor-default select-none flex items-center gap-1.5 text-[10px] text-primary/40">
          <span>🌱</span>
          <span className="font-mono font-bold tracking-widest uppercase">Root & Rise</span>
        </div>
        {/* -------------------------------- */}

      </div>
    </Modal>
  );
}

function CycleEditorRow({ cycle }: { cycle: WeighedCycleDetail }) {
  const [lots, setLots] = useState(cycle.lots);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Auto-calculate total
  const currentTotal = lots.reduce((sum, l) => sum + (l.bags_weighed || 0), 0);
  const isChanged = currentTotal !== cycle.total_bags || isSaved;

  const handleWeightChange = (lotId: number, value: string) => {
    const num = value === "" ? 0 : parseInt(value, 10);
    setLots(lots.map(l => l.lot_id === lotId ? { ...l, bags_weighed: num } : l));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = lots.map(l => ({ lot_id: l.lot_id, weight: l.bags_weighed }));
    const res = await updateCycleLotWeights(cycle.crop_cycle_id, payload);
    setIsSaving(false);
    
    if (res.success) {
      setIsSaved(true);
      // Remove the saved state after 3 seconds so they can edit again if needed
      setTimeout(() => setIsSaved(false), 3000); 
    }
  };

  return (
    <div className={`p-4 rounded-xl bg-surface border shadow-sm transition-all duration-500 ${
      isSaved 
        ? "border-green-400 shadow-green-100/50 bg-green-50/30" // The Cherry: Success Glow
        : "border-outline/20 focus-within:border-primary/50"
    }`}>
      
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow min-w-0 pr-4 space-y-1">
          <p className="font-semibold text-on-surface text-base truncate flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary flex-shrink-0" />
            {cycle.farmer_name}
          </p>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1 truncate">
              <Wheat className="w-3 h-3" /> {cycle.variety_name}
            </span>
            <span className="flex items-center gap-1 font-medium text-on-surface">
              <Package className={`w-3 h-3 ${isSaved ? 'text-green-500' : 'text-primary'}`} /> 
              Master Total: {currentTotal}
            </span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || (!isChanged && !isSaved)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            isSaved 
              ? "bg-green-100 text-green-700" 
              : isChanged 
                ? "bg-primary text-on-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]" 
                : "bg-surface-variant/50 text-on-surface-variant cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <LoaderCircle className="w-4 h-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
        </button>
      </div>

      {/* Bottom Lots Section */}
      <div className="pt-3 border-t border-outline/10">
        {lots.length === 0 ? (
           <p className="text-xs text-error">No individual lots found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {lots.map((lot) => (
              <div 
                key={lot.lot_id} 
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors ${
                  isSaved 
                    ? "bg-green-50/50 border-green-200" 
                    : "bg-surface-variant/30 border-outline/10 focus-within:border-primary/50 focus-within:bg-surface"
                }`}
              >
                <Tag className={`w-3 h-3 flex-shrink-0 ${isSaved ? 'text-green-600' : 'text-on-surface-variant'}`} />
                <span className={`text-xs font-medium truncate w-14 ${isSaved ? 'text-green-700' : 'text-on-surface-variant'}`} title={lot.lot_number}>
                  {lot.lot_number}
                </span>
                <input
                  type="number"
                  value={lot.bags_weighed === 0 ? "" : lot.bags_weighed}
                  placeholder="0"
                  onChange={(e) => handleWeightChange(lot.lot_id, e.target.value)}
                  className={`w-full min-w-[30px] bg-transparent text-sm font-semibold outline-none text-right ${
                    isSaved ? 'text-green-800' : 'text-on-surface'
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}