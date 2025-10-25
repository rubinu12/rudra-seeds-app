// components/employee/harvesting/WeighingInputSection.tsx
"use client";

import React, { useState, useMemo, useTransition } from 'react';
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';
import { FormState, recordWeighing } from '@/app/employee/harvesting/actions';
import { Input } from '@/components/ui/FormInputs'; // Assuming a suitable Input component exists
import { Save, LoaderCircle, X, AlertTriangle, LockKeyhole, Info } from 'lucide-react';

type WeighingInputProps = {
    cycle: CropCycleForEmployeeWeighing;
    onCancel: () => void; // Function to call when cancelling
    // We might not need onSave callback if we use useActionState here directly
};

// Define initial state for useActionState if used, or local state management
const initialFormState: FormState = { message: '', success: false, errors: {} };

export default function WeighingInputSection({ cycle, onCancel }: WeighingInputProps) {
    const [bagsWeighed, setBagsWeighed] = useState('');
    const [bagsWeighedConfirm, setBagsWeighedConfirm] = useState('');
    const [isPending, startTransition] = useTransition();
    // Local state for action results, mirroring FormState structure
    const [actionResult, setActionResult] = useState<FormState | null>(null);

    // Calculate threshold and flag
    const purchased = cycle.seed_bags_purchased ?? 0;
    const returned = cycle.seed_bags_returned ?? 0;
    const finalSeedBags = purchased - returned;
    const threshold = finalSeedBags > 0 ? finalSeedBags * 50 : 0; // 50x multiplier
    const isOverThreshold = threshold > 0 && bagsWeighed !== '' && Number(bagsWeighed) > threshold;

    const inputsMatch = bagsWeighed !== '' && bagsWeighedConfirm !== '' && bagsWeighed === bagsWeighedConfirm;
    const canSave = inputsMatch && Number(bagsWeighed) > 0 && !isPending;

    const handleSubmit = () => {
        if (!canSave) return;

        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        formData.append('bagsWeighed', bagsWeighed);
        formData.append('bagsWeighedConfirm', bagsWeighedConfirm);
        // Pass calculated values needed for threshold check in action
        formData.append('seedBagsPurchased', String(purchased));
        formData.append('seedBagsReturned', String(returned));

        startTransition(async () => {
            setActionResult(null); // Clear previous errors
            const result = await recordWeighing(null, formData);
            setActionResult(result);
            if (result.success) {
                // Optionally clear inputs or rely on parent component refresh/UI update
                // For now, keep inputs disabled via `actionResult.success`
                console.log("Weighing saved:", result.message);
                // Parent component (HarvestingDashboard) will need to refresh list
                 window.location.reload(); // Simple refresh for now
            } else {
                console.error("Weighing save error:", result.message, result.errors);
            }
        });
    };

    // Determine error message based on validation state or server response
    let errorMessage = '';
    if (actionResult && !actionResult.success) {
        errorMessage = actionResult.message; // Prioritize server error
        // Check for specific field errors from Zod
        if (actionResult.errors?.bagsWeighedConfirm) {
            errorMessage = actionResult.errors.bagsWeighedConfirm[0];
        } else if (actionResult.errors?.bagsWeighed) {
             errorMessage = actionResult.errors.bagsWeighed[0];
        }
    } else if (bagsWeighed !== '' && bagsWeighedConfirm !== '' && !inputsMatch) {
        errorMessage = 'Bag counts do not match.'; // Client-side mismatch error
    }

    const isSuccess = actionResult?.success ?? false;

    return (
        <div className="mt-3 pt-3 border-t border-outline/20 space-y-4">
             <div className="flex items-center gap-2 text-sm text-primary-dark bg-primary-container p-3 rounded-lg">
                <Info className="w-5 h-5 flex-shrink-0"/>
                <span>
                    Net Seed Bags Issued: <strong>{finalSeedBags >= 0 ? finalSeedBags : 'N/A'}</strong>.
                    {threshold > 0 && ` Max expected bags (x50): ~${threshold}`}
                </span>
            </div>

            <div className={`relative ${isOverThreshold ? 'border-2 border-error rounded-xl p-0.5' : ''}`}>
                 <Input
                    id={`bagsWeighed-${cycle.crop_cycle_id}`}
                    name="bagsWeighed"
                    label="Total Bags Weighed"
                    type="number" // Use number for better mobile keyboard
                    inputMode="numeric" // Hint for numeric keyboard
                    pattern="[0-9]*" // Allow only digits (basic pattern)
                    value={bagsWeighed}
                    onChange={(e) => setBagsWeighed(e.target.value.replace(/\D/g, ''))} // Allow only digits
                    disabled={isPending || isSuccess}
                    required
                    className={` ${isOverThreshold ? '!border-transparent focus-within:!border-transparent' : ''}`} // Override border styles if flagged
                />
                 {isOverThreshold && (
                    <div className="absolute top-1 right-2 flex items-center gap-1 text-xs text-error font-medium">
                        <AlertTriangle className="w-4 h-4" /> High
                    </div>
                )}
            </div>

            <div className="relative">
                <Input
                    id={`bagsWeighedConfirm-${cycle.crop_cycle_id}`}
                    name="bagsWeighedConfirm"
                    label="Confirm Total Bags"
                    type="password" // Use password type to mask input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={bagsWeighedConfirm}
                    onChange={(e) => setBagsWeighedConfirm(e.target.value.replace(/\D/g, ''))} // Allow only digits
                    disabled={isPending || isSuccess}
                    required
                    // Add error border if counts don't match (and both are filled)
                    className={`${errorMessage === 'Bag counts do not match.' ? 'border-error focus-within:border-error' : ''}`}
                />
                 <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-on-surface-variant">
                    <LockKeyhole className="w-5 h-5"/>
                 </div>
            </div>

            {/* Error Message Area */}
             {errorMessage && !isSuccess && (
                <p className="text-sm text-error text-center font-medium">{errorMessage}</p>
            )}
            {/* Success Message Area */}
            {isSuccess && actionResult?.message && (
                 <p className="text-sm text-green-600 text-center font-medium">{actionResult.message}</p>
            )}


            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isPending || isSuccess} // Disable cancel after success? Maybe not. Keep enabled.
                    className="flex-1 h-[48px] text-base font-medium rounded-full border border-outline text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSave || isSuccess} // Disable if cannot save or already succeeded
                    className="flex-1 h-[48px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg transition-all disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Weight
                </button>
            </div>
        </div>
    );
}

// Helper (copied from VerifyPriceModal) - if used frequently, move to a shared utils file
const SampleDataItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center gap-1.5 text-on-surface-variant">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5}/>
        <span className="font-medium">{label}:</span>
        <span className="text-on-surface truncate">{value}</span>
    </div>
);