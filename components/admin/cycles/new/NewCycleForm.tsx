// components/admin/cycles/new/NewCycleForm.tsx
"use client";

import { useState, useEffect, useActionState } from 'react';
import { Landmark, SeedVariety, FarmerDetails } from '@/lib/definitions';
import { createOrUpdateCycle } from '@/app/admin/cycles/new/actions';
import FarmerDetailsForm from './FarmerDetailsForm';
import BankDetailsForm from './BankDetailsForm';
import FarmSowingForm from './FarmSowingForm';
import PaymentSection from './PaymentSection';

type NewCycleFormProps = {
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
  initialSeedPrice: number;
};

const initialState = { message: '', success: false };

export default function NewCycleForm({ landmarks, seedVarieties, initialSeedPrice }: NewCycleFormProps) {
  const [state, formAction] = useActionState(createOrUpdateCycle, initialState);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerDetails | null>(null);
  const [seedBags, setSeedBags] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    setTotalCost(seedBags * initialSeedPrice);
  }, [seedBags, initialSeedPrice]);

  return (
    // FINAL FIX: This grid layout is the key to the whole page structure.
    <form action={formAction} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
      
      {/* --- LEFT COLUMN --- */}
      <div className="flex flex-col gap-6">
        <FarmerDetailsForm 
          onFarmerSelect={setSelectedFarmer}
          selectedFarmer={selectedFarmer}
        />
        <BankDetailsForm farmer={selectedFarmer} />
      </div>

      {/* --- RIGHT STICKY SIDEBAR --- */}
      <div className="sticky top-24 flex flex-col gap-6">
        <FarmSowingForm 
          farmer={selectedFarmer}
          landmarks={landmarks} 
          seedVarieties={seedVarieties}
          onSeedBagsChange={setSeedBags} 
        />
        <PaymentSection 
          totalCost={totalCost}
          initialSeedPrice={initialSeedPrice}
        />
         {state?.message && !state.success && (
          <p className="text-sm text-center text-error mt-2">{state.message}</p>
        )}
      </div>
    </form>
  );
}