"use client";

import React, { useState, useRef, useEffect } from 'react';
import Modal from '@/src/components/ui/Modal';
import { Input } from '@/src/components/ui/FormInputs';
// [CHANGE] Import type from the action file to ensure sync
import { 
    verifyAndFinalizePrice, 
    CycleForPriceVerification 
} from '@/src/app/admin/actions/pricing-actions'; 
import { CheckCircle, LoaderCircle, RefreshCw, Phone, Droplets, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
      <h2 className="text-xl font-medium text-slate-900">Verify Final Prices</h2>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        {isRefreshing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ModalHeader}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        {cycles.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic">
            No cycles waiting for price verification.
          </div>
        ) : (
          cycles.map((cycle, index) => (
            <PriceRow 
                key={cycle.crop_cycle_id} 
                cycle={cycle} 
                onSuccess={onRefresh} 
                autoFocus={index === 0}
            />
          ))
        )}
      </div>
    </Modal>
  );
}

function PriceRow({ cycle, onSuccess, autoFocus }: { cycle: CycleForPriceVerification, onSuccess: () => void, autoFocus?: boolean }) {
    const [finalPrice, setFinalPrice] = useState(cycle.temporary_price_per_man?.toString() || "");
    const [isPending, setIsPending] = useState(false);
    const rowRef = useRef<HTMLDivElement>(null);
    const callLinkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (autoFocus && rowRef.current) {
            rowRef.current.focus();
        }
    }, [autoFocus]);

    const handleConfirmPrice = async () => {
        if (!finalPrice) return;
        setIsPending(true);
        const res = await verifyAndFinalizePrice(cycle.crop_cycle_id, Number(finalPrice));
        if (res.success) {
            toast.success("Price Confirmed");
            onSuccess();
        } else {
            toast.error(res.error || "Failed to verify price");
        }
        setIsPending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            e.stopPropagation();
            if (cycle.mobile_number && callLinkRef.current) {
                toast.info(`Calling ${cycle.farmer_name}...`);
                callLinkRef.current.click();
            } else {
                toast.warning("No mobile number available");
            }
        }
        if (e.key === 'Enter' && finalPrice) {
            e.preventDefault();
            handleConfirmPrice();
        }
    };

    return (
        <div 
            ref={rowRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all hover:shadow-md focus:ring-2 focus:ring-slate-900 focus:outline-none relative group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 mr-2">
                    <h3 className="font-bold text-slate-900 text-lg truncate">{cycle.farmer_name}</h3>
                    
                    {/* [UPDATED DISPLAY] Show Lot Numbers */}
                    <div className="flex flex-wrap gap-2 items-center mb-1 mt-1">
                        <span className="text-xs text-slate-500 font-medium truncate">
                            {cycle.variety_name} • {cycle.village_name}
                        </span>
                        {cycle.lot_number && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                {cycle.lot_number}
                            </span>
                        )}
                    </div>

                    {cycle.mobile_number ? (
                        <a 
                            ref={callLinkRef}
                            href={`tel:${cycle.mobile_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 mt-2 border border-green-100"
                            title="Shortcut: Alt + C"
                        >
                            <Phone className="w-3 h-3" />
                            <span className="text-xs font-bold">{cycle.mobile_number}</span>
                        </a>
                    ) : (
                        <span className="text-xs text-slate-400 font-medium italic mt-2 block">No Phone Number</span>
                    )}
                </div>
                <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Proposed</span>
                    <span className="text-sm font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                         ₹{cycle.temporary_price_per_man || '0'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                 <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 mb-1">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Moisture</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                        {cycle.sample_moisture ? `${cycle.sample_moisture}%` : 'N/A'}
                    </span>
                 </div>
                 <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Purity</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                        {cycle.sample_purity ? `${cycle.sample_purity}%` : 'N/A'}
                    </span>
                 </div>
                 <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3 text-orange-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Non-Seed</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                        {cycle.sample_non_seed || 'N/A'}
                    </span>
                 </div>
            </div>

            <div className="flex items-end gap-3 pt-3 border-t border-slate-200">
                 <div className="flex-1 relative">
                    <Input
                        label="Final Price (₹/Man)"
                        type="number"
                        value={finalPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinalPrice(e.target.value)}
                        disabled={isPending}
                        autoFocus={false}
                        placeholder="Type price..."
                    />
                 </div>
                 <button
                    onClick={handleConfirmPrice}
                    disabled={isPending || !finalPrice}
                    className="h-[52px] px-6 bg-slate-900 text-white rounded-xl flex items-center gap-2 font-bold hover:bg-slate-800 disabled:opacity-50 transition-all mb-[2px] active:scale-95 shadow-md hover:shadow-lg"
                >
                    {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm
                </button>
            </div>
        </div>
    );
}