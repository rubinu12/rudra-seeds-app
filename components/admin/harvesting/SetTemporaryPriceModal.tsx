// components/admin/harvesting/SetTemporaryPriceModal.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/FormInputs';
import { CycleForPriceApproval } from '@/lib/definitions';
import { Save, LoaderCircle, Droplet, Percent, CircleDotDashed, Palette, ScanText } from 'lucide-react';
import { setTemporaryPrice, FormState } from '@/app/employee/harvesting/actions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForPriceApproval[];
};

export default function SetTemporaryPriceModal({ isOpen, onClose, cycles }: Props) {
  // Debug log removed
  // console.log('--- RENDERING NEW SetTemporaryPriceModal ---', new Date().toLocaleTimeString());

  return (
    // Changed title from placeholder
    <Modal isOpen={isOpen} onClose={onClose} title="Set Temporary Prices" maxWidth="max-w-xl">
       {/* Debug text removed */}
      {/* <h1 className="text-red-500 font-bold text-2xl mb-4">!! NEW MODAL CODE EXECUTING !!</h1> */}

      {/* Container for cycle entries - REMOVED max-h and overflow-y-auto */}
      {/* Let the parent Modal component handle scrolling */}
      <div className="space-y-4">
        {cycles.length > 0 ? (
          cycles.map((cycle) => (
            <CyclePriceEntry key={cycle.crop_cycle_id} cycle={cycle} />
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">
            No cycles are currently waiting for a temporary price.
          </p>
        )}
      </div>
    </Modal>
  );
}

// --- Sub-Component for each Cycle Entry ---
function CyclePriceEntry({ cycle }: { cycle: CycleForPriceApproval }) {
    const [tempPrice, setTempPrice] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const [actionResult, setActionResult] = useState<FormState | null>(null);

    const handleSavePrice = () => {
        if (!tempPrice || Number(tempPrice) <= 0) {
            setActionResult({ message: "Please enter a valid price greater than zero.", success: false, cycleId: cycle.crop_cycle_id });
            return;
        }
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        formData.append('temporaryPrice', tempPrice);

        startTransition(async () => {
            setActionResult(null);
            console.log("Calling setTemporaryPrice action for cycle:", cycle.crop_cycle_id);
            const result = await setTemporaryPrice(null, formData);
            setActionResult(result);
            if (result.success) {
                 console.log("Success:", result.message);
                 // UI update relies on disabling + feedback message. Full list refresh requires closing/reopening or page refresh.
            } else {
                 console.error("Set Temp Price Error:", result.message, result.errors);
            }
        });
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return 'Invalid Date'; }
    };

    return (
        <div className="p-4 rounded-xl bg-surface border border-outline/20 shadow-sm space-y-3">
            {/* Farmer Info */}
            <div>
                <p className="font-semibold text-on-surface text-base">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.seed_variety}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                    Sampled on: {formatDate(cycle.sampling_date)}
                 </p>
            </div>
            {/* Sample Data Display */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs border-t border-b border-outline/10 py-2">
                <SampleDataItem icon={Droplet} label="Moisture" value={`${cycle.sample_moisture ?? 'N/A'}%`} />
                <SampleDataItem icon={Percent} label="Purity" value={`${cycle.sample_purity ?? 'N/A'}%`} />
                <SampleDataItem icon={CircleDotDashed} label="Dust" value={`${cycle.sample_dust ?? 'N/A'}%`} />
                <SampleDataItem icon={Palette} label="Color" value={cycle.sample_colors ?? 'N/A'} />
                <SampleDataItem icon={ScanText} label="Non-Seed" value={cycle.sample_non_seed ?? 'N/A'} />
            </div>
            {/* Price Input and Save Button */}
            <div className="flex items-end gap-3 pt-2">
                <div className="flex-grow">
                     <Input
                        id={`temp_price_${cycle.crop_cycle_id}`}
                        name="temporary_price_per_man"
                        label="Temp Price (₹/Man)"
                        type="number"
                        step="0.01"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        disabled={isPending || (actionResult?.success && actionResult?.cycleId === cycle.crop_cycle_id)}
                        required
                        className={`${actionResult && !actionResult.success && actionResult?.cycleId === cycle.crop_cycle_id ? 'border-error focus-within:border-error' : ''}`}
                     />
                 </div>
                 <button
                    onClick={handleSavePrice}
                    disabled={isPending || (actionResult?.success && actionResult?.cycleId === cycle.crop_cycle_id) || !tempPrice || Number(tempPrice) <= 0 }
                    className="h-[56px] px-5 btn-primary rounded-xl flex items-center justify-center gap-2 text-sm shrink-0 disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                 </button>
            </div>
             {/* Action Result Feedback */}
            {actionResult && actionResult.cycleId === cycle.crop_cycle_id && (
                 <p className={`text-xs mt-1 ${actionResult.success ? 'text-green-600' : 'text-error'}`}>
                    {actionResult.message}
                 </p>
             )}
        </div>
    );
}

// Helper for displaying sample data items compactly
const SampleDataItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5 text-on-surface-variant">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5}/>
        <span className="font-medium">{label}:</span>
        <span className="text-on-surface truncate">{value}</span>
    </div>
);