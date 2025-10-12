// components/admin/cycles/new/NewCycleForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Landmark, SeedVariety, FarmerDetails } from '@/lib/definitions';
import { createOrUpdateCycle } from '@/app/admin/cycles/new/actions';
import { Save, X } from 'lucide-react';

// Import the actual components
import FarmerSearch from './FarmerSearch';
import FarmerDetailsForm from './FarmerDetailsForm';
import BankDetailsForm from './BankDetailsForm';
import FarmSowingForm from './FarmSowingForm';
import PaymentSection from './PaymentSection';

// Define the props for our main form component
type NewCycleFormProps = {
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
  initialSeedPrice: number;
};

const initialState = {
  message: '',
  success: false,
};

export default function NewCycleForm({ landmarks, seedVarieties, initialSeedPrice }: NewCycleFormProps) {
  // State for the server action
  const [state, formAction] = useActionState(createOrUpdateCycle, initialState);

  // State to hold the currently selected farmer's details
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerDetails | null>(null);

  // State for calculating the total cost
  const [seedBags, setSeedBags] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // When the number of seed bags changes, recalculate the total cost
  useEffect(() => {
    const cost = seedBags * initialSeedPrice;
    setTotalCost(cost);
  }, [seedBags, initialSeedPrice]);

  // This function will be called by the FarmerSearch component when a farmer is selected
  const handleFarmerSelect = (farmer: FarmerDetails | null) => {
    setSelectedFarmer(farmer);
  };

  return (
    <form action={formAction} className="space-y-6">
      
      {/* Section 1: Farmer Search */}
      <FarmerSearch 
        onFarmerSelect={handleFarmerSelect} 
        selectedFarmer={selectedFarmer} // FIX: Pass the selectedFarmer state down
      />

      {/* The rest of the form only renders after a farmer is selected OR the user clears the selection to add a new one */}
      <>
        {/* Section 2: Farmer Details */}
        <FarmerDetailsForm farmer={selectedFarmer} />
        
        {/* Section 3: Bank Details */}
        <BankDetailsForm farmer={selectedFarmer} />

        {/* Section 4: Farm & Sowing Details */}
        <FarmSowingForm 
          farmer={selectedFarmer} // FIX: Pass the selectedFarmer state down
          landmarks={landmarks} 
          seedVarieties={seedVarieties}
          onSeedBagsChange={(bags) => setSeedBags(bags)} 
        />

        {/* Section 5: Payment */}
        <PaymentSection 
            totalCost={totalCost}
            initialSeedPrice={initialSeedPrice}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" className="btn px-8 py-3 font-medium rounded-m3-full text-primary bg-surface-variant/80 hover:bg-outline/20 flex items-center gap-2">
            <X className="h-5 w-5" />
            Cancel
          </button>
          <button type="submit" className="btn px-8 py-3 font-medium rounded-m3-full text-on-primary bg-primary hover:bg-primary/90 shadow-m3-active flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save and Create Cycle
          </button>
        </div>

        {/* Display Server Action Messages */}
        {state?.message && !state.success && (
          <p className="text-sm text-error mt-4">{state.message}</p>
        )}
      </>
    </form>
  );
}