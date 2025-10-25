// components/admin/harvesting/VerifyPriceModal.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/FormInputs';
import { CycleForPriceVerification } from '@/lib/definitions';
import { CheckCircle, LoaderCircle, Droplet, Percent, CircleDotDashed, Palette, ScanText, Phone, IndianRupee, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { verifyPrice, FormState } from '@/app/employee/harvesting/actions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForPriceVerification[];
  onRefresh: () => Promise<void>; // Add refresh function prop
  isRefreshing: boolean; // Add state prop for loading indicator
};

export default function VerifyPriceModal({ isOpen, onClose, cycles, onRefresh, isRefreshing }: Props) { // Added props

  // Custom Header with Refresh Button
  const ModalHeader = (
    <div className="flex items-center justify-between w-full">
      <h2 id="modal-title" className="text-xl font-medium text-on-surface">Verify Final Prices</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh} // Call the refresh handler
          disabled={isRefreshing} // Disable while refreshing
          className="p-2 rounded-full text-on-surface-variant hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait"
          aria-label="Refresh list"
        >
          {isRefreshing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        </button>
        {/* Close button is now part of the standard Modal component */}
      </div>
    </div>
  );


  return (
    // Pass the custom header component to the Modal
    <Modal isOpen={isOpen} onClose={onClose} title={ModalHeader} maxWidth="max-w-xl">
      {/* Container - REMOVED max-h and overflow-y-auto */}
      <div className="space-y-4">
        {cycles.length > 0 ? (
          cycles.map((cycle) => (
            <CycleVerifyEntry key={cycle.crop_cycle_id} cycle={cycle} />
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">
            {isRefreshing ? 'Refreshing...' : 'No cycles are currently waiting for final price verification.'}
          </p>
        )}
      </div>
    </Modal>
  );
}

// --- Sub-Component for each Cycle Entry ---
// CycleVerifyEntry remains the same as before
function CycleVerifyEntry({ cycle }: { cycle: CycleForPriceVerification }) {
    const initialPrice = cycle.temporary_price_per_man?.toString() ?? '';
    const [finalPrice, setFinalPrice] = useState<string>(initialPrice);
    const [isPending, startTransition] = useTransition();
    const [actionResult, setActionResult] = useState<FormState | null>(null);

    useEffect(() => {
        setFinalPrice(cycle.temporary_price_per_man?.toString() ?? '');
        setActionResult(null);
    }, [cycle.temporary_price_per_man, cycle.crop_cycle_id]);


    const handleConfirmPrice = () => {
        if (!finalPrice || Number(finalPrice) <= 0) {
            setActionResult({ message: "Please enter a valid final price greater than zero.", success: false, cycleId: cycle.crop_cycle_id });
            return;
        }
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        formData.append('finalPrice', finalPrice);

        startTransition(async () => {
            setActionResult(null);
            console.log("Calling verifyPrice action for cycle:", cycle.crop_cycle_id);
            const result = await verifyPrice(null, formData);
            setActionResult(result);
            if (result.success) {
                 console.log("Success:", result.message);
                 // Parent component (dashboard page) needs to trigger refresh to update list
            } else {
                 console.error("Verify Price Error:", result.message, result.errors);
            }
        });
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return 'Invalid Date'; }
    };

    const tempPriceAsNumber = Number(cycle.temporary_price_per_man);
    const formattedTempPrice = cycle.temporary_price_per_man != null && !isNaN(tempPriceAsNumber)
        ? `₹${tempPriceAsNumber.toFixed(2)}`
        : 'N/A';

    return (
        <div className="p-4 rounded-xl bg-surface border border-outline/20 shadow-sm space-y-3">
             <div className="flex justify-between items-start">
                 {/* Farmer Info + Phone */}
                <div>
                    <p className="font-semibold text-on-surface text-base">{cycle.farmer_name}</p>
                    {cycle.mobile_number ? (
                        <p className="flex items-center gap-1 text-sm text-on-surface-variant my-1">
                            <Phone className="w-3 h-3" />
                            {cycle.mobile_number}
                        </p>
                    ) : (
                        <p className="flex items-center gap-1 text-sm text-on-surface-variant/70 my-1 italic">
                            <Phone className="w-3 h-3" /> (No mobile)
                        </p>
                    )}
                    <p className="text-sm text-on-surface-variant">{cycle.seed_variety}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                        Sampled on: {formatDate(cycle.sampling_date)}
                    </p>
                </div>
                 {/* Call Button */}
                 {cycle.mobile_number && (
                     <a href={`tel:${cycle.mobile_number}`}
                        className="flex-shrink-0 ml-2 mt-1 p-2 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors"
                        aria-label={`Call ${cycle.farmer_name}`}
                     >
                        <Phone className="w-5 h-5" />
                    </a>
                 )}
            </div>
            {/* Sample Data Display */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs border-t border-b border-outline/10 py-2">
                <SampleDataItem icon={Droplet} label="Moisture" value={`${cycle.sample_moisture ?? 'N/A'}%`} />
                <SampleDataItem icon={Percent} label="Purity" value={`${cycle.sample_purity ?? 'N/A'}%`} />
                <SampleDataItem icon={CircleDotDashed} label="Dust" value={`${cycle.sample_dust ?? 'N/A'}%`} />
                <SampleDataItem icon={Palette} label="Color" value={cycle.sample_colors ?? 'N/A'} />
                <SampleDataItem icon={ScanText} label="Non-Seed" value={cycle.sample_non_seed ?? 'N/A'} />
                 <SampleDataItem icon={IndianRupee} label="Proposed" value={formattedTempPrice} />
            </div>
            {/* Final Price Input and Confirm Button */}
            <div className="flex items-end gap-3 pt-2">
                <div className="flex-grow">
                     <Input
                        id={`final_price_${cycle.crop_cycle_id}`}
                        name="finalPrice"
                        label="Final Price (₹/Man)"
                        type="number"
                        step="0.01"
                        value={finalPrice}
                        onChange={(e) => setFinalPrice(e.target.value)}
                        disabled={isPending || (actionResult?.success && actionResult?.cycleId === cycle.crop_cycle_id)}
                        required
                        className={`${actionResult && !actionResult.success && actionResult?.cycleId === cycle.crop_cycle_id ? 'border-error focus-within:border-error' : ''}`}
                     />
                 </div>
                 <button
                    onClick={handleConfirmPrice}
                    disabled={isPending || (actionResult?.success && actionResult?.cycleId === cycle.crop_cycle_id) || !finalPrice || Number(finalPrice) <= 0 }
                    className="h-[56px] px-5 btn-primary rounded-xl flex items-center justify-center gap-2 text-sm shrink-0 disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm
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

// Helper (same as before)
const SampleDataItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5 text-on-surface-variant">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5}/>
        <span className="font-medium">{label}:</span>
        <span className="text-on-surface truncate">{value}</span>
    </div>
);