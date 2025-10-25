// components/admin/harvesting/SetTemporaryPriceModal.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/FormInputs'; // Assuming Input is exported here
import { CycleForPriceApproval } from '@/lib/definitions'; // Import type from definitions
import { Save, LoaderCircle, Droplet, Percent, CircleDotDashed, Palette, ScanText } from 'lucide-react';
// *** Step 1: Import the server action ***
import { setTemporaryPrice, FormState } from '@/app/employee/harvesting/actions'; // Import action and FormState type

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForPriceApproval[];
};

// Removed local ActionState type, using imported FormState

export default function SetTemporaryPriceModal({ isOpen, onClose, cycles }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Temporary Prices" maxWidth="max-w-xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
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
    const [tempPrice, setTempPrice] = useState<string>(''); // Local state for the input
    const [isPending, startTransition] = useTransition();
    // Use imported FormState for action result feedback
    const [actionResult, setActionResult] = useState<FormState | null>(null);

    const handleSavePrice = () => {
        // Basic client-side check (Zod validation happens in the action)
        if (!tempPrice) {
            setActionResult({ message: "Please enter a price.", success: false, cycleId: cycle.crop_cycle_id });
            return;
        }

        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        formData.append('temporaryPrice', tempPrice);

        startTransition(async () => {
            setActionResult(null); // Clear previous result
            console.log("Calling setTemporaryPrice action...");
            // *** Step 2: Replace placeholder with actual action call ***
            const result = await setTemporaryPrice(null, formData);
            // *** Step 3: Use the result from the server action ***
            setActionResult(result); // Store the result (includes message, success, cycleId)

            if (result.success) {
                 // Optionally disable input/button after success or rely on revalidation
                 alert(result.message); // Simple alert for now
                 window.location.reload(); // Simple reload until proper state management/revalidation is implemented
            } else {
                 console.error("Set Temp Price Error:", result.message, result.errors);
                 // Error message is displayed via actionResult state below the input
            }
        });
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN');
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
                        disabled={isPending || actionResult?.success}
                        required
                        className={actionResult && !actionResult.success ? 'border-error' : ''}
                     />
                 </div>
                 <button
                    onClick={handleSavePrice}
                    // Disable if pending, already succeeded, or price is invalid/empty
                    disabled={isPending || actionResult?.success || !tempPrice || Number(tempPrice) <= 0 }
                    className="h-[56px] px-5 btn-primary rounded-xl flex items-center justify-center gap-2 text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" // Updated disabled style
                >
                    {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                 </button>
            </div>
             {/* Action Result Feedback - Uses result from server action */}
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