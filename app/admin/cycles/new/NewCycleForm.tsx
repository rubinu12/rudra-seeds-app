// app/admin/cycles/new/NewCycleForm.tsx
"use client";

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Landmark, SeedVariety, FarmerDetails, Farm, BankAccount, Village } from '@/lib/definitions';
import { createOrUpdateCycle } from './actions';
import { useDebounce } from '@/hooks/useDebounce';
import { FarmerSection } from '@/components/admin/cycles/new/FarmerSection';
import { SowingSection } from '@/components/admin/cycles/new/SowingSection';
import { PaymentSection } from '@/components/admin/cycles/new/PaymentSection';

// Define the props for the form, now including villages
type FormProps = { 
  landmarks: Landmark[]; 
  seedVarieties: SeedVariety[]; 
  villages: Village[];
  initialSeedPrice: number; 
};

export function NewCycleForm({ landmarks, seedVarieties, villages, initialSeedPrice }: FormProps) {
  const [state, formAction] = useActionState(createOrUpdateCycle, { message: '', success: false });
  
  // --- UI & API State ---
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[]>([]);
  const [existingFarms, setExistingFarms] = useState<Farm[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);

  // --- Decoupled State Management for each form section ---
  const [farmerData, setFarmerData] = useState({ id: '', name: '', mobile: '', aadhar: '', address: '' });
  const [farmData, setFarmData] = useState({ id: '', location: '', area: '', villageId: '' });
  const [bankData, setBankData] = useState({ id: '', name: '', number: '', ifsc: '', bankName: '' });
  const [cycleData, setCycleData] = useState({ landmarkId: '', seedId: '', bags: 0, date: new Date().toISOString().split('T')[0], collection: 'RudraSeeds Pickup', payment: 'Paid' });
  
  const debouncedSearch = useDebounce(farmerData.mobile, 300);

  // --- Memos for computed values ---
  const totalCost = useMemo(() => cycleData.bags * initialSeedPrice, [cycleData.bags, initialSeedPrice]);
  const isFormValid = useMemo(() => {
    const isFarmerValid = farmerData.name && farmerData.mobile && farmerData.aadhar && farmerData.address;
    const isFarmValid = (farmData.id || (farmData.location && farmData.area)) && farmData.villageId;
    const isBankValid = bankData.id || (bankData.name && bankData.number && bankData.ifsc && bankData.bankName);
    const isCycleValid = cycleData.landmarkId && cycleData.seedId && cycleData.bags > 0;
    return !!(isFarmerValid && isFarmValid && isBankValid && isCycleValid);
  }, [farmerData, farmData, bankData, cycleData]);

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (isSearchEnabled && debouncedSearch && !farmerData.id) {
      setIsLoading(true);
      fetch(`/api/farmers/search?query=${debouncedSearch}`)
        .then(res => res.json())
        .then(data => setSearchResults(data))
        .finally(() => setIsLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, farmerData.id, isSearchEnabled]);

  // --- Event Handlers ---
  const handleSelectFarmer = async (f: Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>) => {
    setSearchResults([]);
    setIsLoading(true);
    const res = await fetch(`/api/farmers/${f.farmer_id}/details`);
    const details: FarmerDetails = await res.json();
    
    setFarmerData({ id: String(details.farmer_id), name: details.name, mobile: details.mobile_number, aadhar: details.aadhar_number, address: details.home_address });
    setExistingFarms(details.farms || []);
    setExistingAccounts(details.bank_accounts || []);
    
    if (details.farms?.[0]) { 
        setFarmData({ id: String(details.farms[0].farm_id), location: '', area: '', villageId: String((details.farms[0] as any).village_id || '') }); 
    } else { 
        setFarmData({ id: '', location: '', area: '', villageId: '' }); 
    }
    if (details.bank_accounts?.[0]) { 
        setBankData({ id: String(details.bank_accounts[0].account_id), name: '', number: '', ifsc: '', bankName: '' }); 
    } else { 
        setBankData({ id: '', name: details.name, number: '', ifsc: '', bankName: '' }); 
    }
    setIsLoading(false);
  };
  
  const handleClear = () => {
    setFarmerData({ id: '', name: '', mobile: '', aadhar: '', address: '' });
    setFarmData({ id: '', location: '', area: '', villageId: '' });
    setBankData({ id: '', name: '', number: '', ifsc: '', bankName: '' });
    setCycleData({ landmarkId: '', seedId: '', bags: 0, date: new Date().toISOString().split('T')[0], collection: 'RudraSeeds Pickup', payment: 'Paid' });
    setExistingFarms([]);
    setExistingAccounts([]);
  };

  const createFormAction = (formData: FormData) => {
    formData.set('farmer_id', farmerData.id);
    formData.set('farmer_name', farmerData.name);
    formData.set('mobile_number', farmerData.mobile);
    formData.set('aadhar_number', farmerData.aadhar);
    formData.set('home_address', farmerData.address);
    formData.set('farm_id', farmData.id);
    formData.set('farm_address', farmData.location);
    formData.set('area_in_vigha', farmData.area);
    formData.set('village_id', farmData.villageId);
    formData.set('account_id', bankData.id);
    formData.set('account_name', bankData.name);
    formData.set('account_no', bankData.number);
    formData.set('ifsc_code', bankData.ifsc);
    formData.set('bank_name', bankData.bankName);
    formData.set('landmark_id', cycleData.landmarkId);
    formData.set('seed_id', cycleData.seedId);
    formData.set('seed_bags_purchased', String(cycleData.bags));
    formData.set('sowing_date', cycleData.date);
    formData.set('goods_collection_method', cycleData.collection);
    formData.set('payment_status', cycleData.payment);
    formData.set('total_cost', String(totalCost));
    formAction(formData);
  };
  
  // Prepare options for the searchable dropdowns
  const villageOptions = villages.map(v => ({ value: String(v.village_id), label: v.village_name }));
  const landmarkOptions = landmarks.map(l => ({ value: String(l.landmark_id), label: l.landmark_name }));
  const seedVarietyOptions = seedVarieties.map(s => ({ value: String(s.seed_id), label: s.variety_name }));

  return (
    <form action={createFormAction} className="max-w-7xl mx-auto my-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Main Column (2/3 width on large screens) */}
      <div className={`lg:col-span-2 flex flex-col gap-6 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <FarmerSection 
          farmerState={[farmerData, setFarmerData]}
          farmState={[farmData, setFarmData]}
          bankState={[bankData, setBankData]}
          searchResults={searchResults}
          isLoading={isLoading}
          existingFarms={existingFarms}
          existingAccounts={existingAccounts}
          handleSelectFarmer={handleSelectFarmer}
          handleClear={handleClear}
          isSearchEnabled={isSearchEnabled}
          setIsSearchEnabled={setIsSearchEnabled}
          villageOptions={villageOptions}
        />
      </div>
      
      {/* Sidebar Column (1/3 width on large screens) */}
      <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky top-6 h-min">
        <SowingSection
          cycleState={[cycleData, setCycleData]}
          landmarkOptions={landmarkOptions}
          seedVarietyOptions={seedVarietyOptions}
        />
        <PaymentSection
          cycleState={[cycleData, setCycleData]}
          totalCost={totalCost}
          seedPrice={initialSeedPrice}
          isFormValid={isFormValid}
          handleClear={handleClear}
          state={state}
        />
      </div>
    </form>
  );
}