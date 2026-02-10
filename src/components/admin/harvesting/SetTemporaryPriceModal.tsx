"use client";

import { useState } from 'react';
import Modal from '@/src/components/ui/Modal';
import { RefreshCw, LoaderCircle, IndianRupee, Save, Droplet, Percent, CircleDotDashed, Palette, ScanText } from 'lucide-react';
import { CycleForPriceApproval, submitTemporaryPrice } from '@/src/app/admin/actions/pricing-actions';
import FloatingLabelInput from '@/src/components/ui/FloatingLabelInput';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForPriceApproval[];
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
};

export default function SetTemporaryPriceModal({ isOpen, onClose, cycles, onRefresh, isRefreshing }: Props) {
  const ModalHeader = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-xl font-medium text-on-surface">Propose Temporary Prices</h2>
      <button onClick={onRefresh} disabled={isRefreshing} className="p-2 rounded-full hover:bg-black/10 transition-colors">
        {isRefreshing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ModalHeader} maxWidth="max-w-xl">
      <div className="space-y-4">
        {cycles.length > 0 ? (
          cycles.map((cycle) => (
            <PriceEntry key={cycle.crop_cycle_id} cycle={cycle} onComplete={onRefresh} />
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8 font-medium">
            {isRefreshing ? 'Refreshing...' : 'No samples waiting for pricing.'}
          </p>
        )}
      </div>
    </Modal>
  );
}

function PriceEntry({ cycle, onComplete }: { cycle: CycleForPriceApproval, onComplete: () => void }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append('cropCycleId', cycle.crop_cycle_id.toString());
    const res = await submitTemporaryPrice(formData);
    if (res.success) onComplete();
    else setIsSaving(false);
  };

  return (
    <div className="p-4 rounded-2xl bg-surface border border-outline/20 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-on-surface">{cycle.farmer_name}</p>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">{cycle.seed_variety}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 py-2 border-y border-outline/10">
        <QualityTag icon={Droplet} label="Moisture" value={`${cycle.sample_moisture}%`} />
        <QualityTag icon={Percent} label="Purity" value={`${cycle.sample_purity}%`} />
        <QualityTag icon={CircleDotDashed} label="Dust" value={`${cycle.sample_dust}%`} />
        <QualityTag icon={Palette} label="Color" value={cycle.sample_colors} />
        <QualityTag icon={ScanText} label="Non-Seed" value={cycle.sample_non_seed} />
      </div>

      <form onSubmit={handleSave} className="flex items-end gap-3 pt-2">
        <div className="flex-grow">
          <FloatingLabelInput label="Proposed Price (₹/Man)" name="temporaryPrice" type="number" step="0.01" required id={''} />
        </div>
        <button type="submit" disabled={isSaving} className="h-[56px] px-6 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all">
          {isSaving ? <LoaderCircle className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Propose
        </button>
      </form>
    </div>
  );
}

const QualityTag = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
    <Icon className="w-3 h-3 shrink-0" />
    <span className="font-medium">{label}:</span>
    <span className="text-on-surface truncate">{value || 'N/A'}</span>
  </div>
);