"use client";

import React, { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/FormInputs';
import { CycleForPriceVerification } from '@/lib/definitions';
import { CheckCircle, LoaderCircle, Droplet, Percent, CircleDotDashed, Palette, ScanText, Phone, IndianRupee, RefreshCw } from 'lucide-react';
import { verifyPrice, FormState } from '@/app/employee/harvesting/actions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForPriceVerification[];
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
};

export default function VerifyPriceModal({ isOpen, onClose, cycles, onRefresh, isRefreshing }: Props) {
  const ModalHeader = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-xl font-medium text-on-surface">Verify Final Prices</h2>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="p-2 rounded-full text-on-surface-variant hover:bg-black/10 transition-colors disabled:opacity-50"
      >
        {isRefreshing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ModalHeader} maxWidth="max-w-xl">
      <div className="space-y-4">
        {cycles.length > 0 ? (
          cycles.map((cycle) => (
            <CycleVerifyEntry key={cycle.crop_cycle_id} cycle={cycle} onRefresh={onRefresh} />
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8 font-medium">
            {isRefreshing ? 'Refreshing list...' : 'No cycles pending final verification.'}
          </p>
        )}
      </div>
    </Modal>
  );
}

function CycleVerifyEntry({ cycle, onRefresh }: { cycle: CycleForPriceVerification, onRefresh: () => Promise<void> }) {
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
            setActionResult({ message: "Invalid price.", success: false, cycleId: cycle.crop_cycle_id });
            return;
        }
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        formData.append('finalPrice', finalPrice);

        startTransition(async () => {
            const result = await verifyPrice(null, formData);
            setActionResult(result);
            if (result.success) {
                 await onRefresh(); // Instant update
            }
        });
    };

    return (
        <div className="p-4 rounded-xl bg-surface border border-outline/20 shadow-sm space-y-3">
             <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-on-surface text-base">{cycle.farmer_name}</p>
                    <p className="text-sm text-on-surface-variant my-1">{cycle.mobile_number || '(No mobile)'}</p>
                    <p className="text-sm text-on-surface-variant">{cycle.seed_variety}</p>
                </div>
                 {cycle.mobile_number && (
                     <a href={`tel:${cycle.mobile_number}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Phone className="w-5 h-5" />
                    </a>
                 )}
            </div>
            
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs border-t border-b border-outline/10 py-2">
                <SampleDataItem icon={Droplet} label="Moisture" value={`${cycle.sample_moisture ?? 'N/A'}%`} />
                <SampleDataItem icon={Percent} label="Purity" value={`${cycle.sample_purity ?? 'N/A'}%`} />
                <SampleDataItem icon={CircleDotDashed} label="Dust" value={`${cycle.sample_dust ?? 'N/A'}%`} />
                <SampleDataItem icon={Palette} label="Color" value={cycle.sample_colors ?? 'N/A'} />
                <SampleDataItem icon={ScanText} label="Non-Seed" value={cycle.sample_non_seed ?? 'N/A'} />
                 <SampleDataItem icon={IndianRupee} label="Proposed" value={cycle.temporary_price_per_man ? `₹${cycle.temporary_price_per_man}` : 'N/A'} />
            </div>

            <div className="flex items-end gap-3 pt-2">
                 <Input
                    id={`final_price_${cycle.crop_cycle_id}`}
                    label="Final Price (₹/Man)"
                    type="number"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    disabled={isPending}
                 />
                 <button
                    onClick={handleConfirmPrice}
                    disabled={isPending || !finalPrice}
                    className="h-[56px] px-6 btn-primary rounded-xl flex items-center gap-2 font-bold"
                >
                    {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm
                 </button>
            </div>
        </div>
    );
}

const SampleDataItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-1.5 text-on-surface-variant">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.5}/>
        <span className="font-medium">{label}:</span>
        <span className="text-on-surface truncate">{value}</span>
    </div>
);