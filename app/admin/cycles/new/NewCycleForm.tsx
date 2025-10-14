// app/admin/cycles/new/NewCycleForm.tsx
"use client";

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Landmark as LandmarkType, SeedVariety, FarmerDetails, Farm, BankAccount } from '@/lib/definitions';
import { createOrUpdateCycle } from './actions';
import { useDebounce } from '@/hooks/useDebounce';
import { FarmerSection } from '@/components/admin/cycles/new/FarmerSection';
import { SowingSection } from '@/components/admin/cycles/new/SowingSection';
import { PaymentSection } from '@/components/admin/cycles/new/PaymentSection';


type FormProps = { landmarks: LandmarkType[]; seedVarieties: SeedVariety[]; initialSeedPrice: number; };

export function NewCycleForm({ landmarks, seedVarieties, initialSeedPrice }: FormProps) {
  const [state, formAction] = useActionState(createOrUpdateCycle, { message: '', success: false });
  
  // --- Decoupled State Management for Performance ---
  const [farmerData, setFarmerData] = useState({ id: '', name: '', mobile: '', village: '', aadhar: '', address: '' });
  const [farmData, setFarmData] = useState({ id: '', location: '', area: '' });
  const [bankData, setBankData] = useState({ id: '', name: '', number: '', ifsc: '', bankName: '' });
  const [cycleData, setCycleData] = useState({ landmarkId: '', seedId: '', bags: 0, date: new Date().toISOString().split('T')[0], collection: 'RudraSeeds Pickup', payment: 'Paid' });
  
  // --- UI & API State ---
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[]>([]);
  const [existingFarms, setExistingFarms] = useState<Farm[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);
  const debouncedSearch = useDebounce(farmerData.mobile, 300);

  const totalCost = useMemo(() => cycleData.bags * initialSeedPrice, [cycleData.bags, initialSeedPrice]);
  const isFormValid = useMemo(() => {
    const isFarmerValid = farmerData.name && farmerData.mobile && farmerData.village && farmerData.aadhar && farmerData.address;
    const isFarmValid = farmData.id || (farmData.location && farmData.area);
    const isBankValid = bankData.id || (bankData.name && bankData.number && bankData.ifsc && bankData.bankName);
    const isCycleValid = cycleData.landmarkId && cycleData.seedId && cycleData.bags > 0;
    return !!(isFarmerValid && isFarmValid && isBankValid && isCycleValid);
  }, [farmerData, farmData, bankData, cycleData]);

  useEffect(() => {
    if (debouncedSearch && !farmerData.id) {
      setIsLoading(true);
      fetch(`/api/farmers/search?query=${debouncedSearch}`).then(res => res.json()).then(data => setSearchResults(data)).finally(() => setIsLoading(false));
    } else { setSearchResults([]); }
  }, [debouncedSearch, farmerData.id]);

  const handleSelectFarmer = async (f: Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>) => {
    setSearchResults([]);
    setIsLoading(true);
    const res = await fetch(`/api/farmers/${f.farmer_id}/details`);
    const details: FarmerDetails = await res.json();
    
    setFarmerData({ id: String(details.farmer_id), name: details.name, mobile: details.mobile_number, village: details.village, aadhar: details.aadhar_number, address: details.home_address });
    setExistingFarms(details.farms || []);
    setExistingAccounts(details.bank_accounts || []);
    
    if (details.farms?.[0]) { setFarmData({ id: String(details.farms[0].farm_id), location: '', area: '' }); } else { setFarmData({ id: '', location: '', area: '' }); }
    if (details.bank_accounts?.[0]) { setBankData({ id: String(details.bank_accounts[0].account_id), name: '', number: '', ifsc: '', bankName: '' }); } else { setBankData({ id: '', name: details.name, number: '', ifsc: '', bankName: '' }); }
    setIsLoading(false);
  };
  
  const handleClear = () => {
    setFarmerData({ id: '', name: '', mobile: '', village: '', aadhar: '', address: '' });
    setFarmData({ id: '', location: '', area: '' });
    setBankData({ id: '', name: '', number: '', ifsc: '', bankName: '' });
    setExistingFarms([]);
    setExistingAccounts([]);
  };

  const createFormAction = (formData: FormData) => {
    // Combine all decoupled states into a single FormData object for the server action
    formData.set('farmer_id', farmerData.id);
    formData.set('farmer_name', farmerData.name);
    formData.set('mobile_number', farmerData.mobile);
    formData.set('village', farmerData.village);
    formData.set('aadhar_number', farmerData.aadhar);
    formData.set('home_address', farmerData.address);
    formData.set('farm_id', farmData.id);
    formData.set('farm_address', farmData.location);
    formData.set('area_in_vigha', farmData.area);
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
  
  return (
    <>
      <form action={createFormAction} className="main-layout">
        <div className={`form-column transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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
          />
        </div>
        
        <div className="sidebar">
          <SowingSection
            cycleState={[cycleData, setCycleData]}
            landmarks={landmarks}
            seedVarieties={seedVarieties}
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

      <style jsx global>{`
        .main-layout { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media (min-width: 1024px) { .main-layout { grid-template-columns: 2fr 1fr; } }
        .form-column { display: flex; flex-direction: column; gap: 1.5rem; }
        .sidebar { position: sticky; top: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; height: min-content; }
        .form-section-card { background-color: #F3EDF7; border-radius: 1.75rem; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .icon-container { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 1rem; }
        .bg-primary-container { background-color: #EADDFF; } .text-on-primary-container { color: #21005D; }
        .bg-tertiary-container { background-color: #FFD8E4; } .text-on-tertiary-container { color: #31111D; }
        .bg-green-200 { background-color: #C8E6C9; } .text-green-800 { color: #2E7D32; } .bg-blue-200 { background-color: #BBDEFB; } .text-blue-800 { color: #1565C0; }
        .section-title { font-size: 1.75rem; font-weight: 400; color: #1C1B1F; }
        .input-container { position: relative; background-color: #E7E0EC; border-radius: 1rem; border: 1px solid #79747E; }
        .input-container:focus-within { border-color: #6750A4; border-width: 2px; }
        .form-input { width: 100%; height: 56px; padding: 22px 16px 6px 16px; background-color: transparent; border: none; outline: none; font-size: 1rem; color: #1C1B1F; }
        textarea.form-input { padding-top: 26px; height: 100%; } .h-small { min-height: 90px; } .h-large { min-height: 128px; }
        select.form-input { cursor: pointer; -webkit-appearance: none; -moz-appearance: none; appearance: none; }
        .form-label { position: absolute; left: 16px; top: 18px; font-size: 1rem; color: #49454F; pointer-events: none; transition: all 0.2s ease; }
        .form-input:focus + .form-label, .form-input:not(:placeholder-shown) + .form-label, select:not([value=""]) + .form-label { top: 6px; font-size: 0.75rem; color: #6750A4; }
        .input-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #49454F; }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 9999px; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background-color: #6750A4; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); } .btn-primary:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); } .btn-primary:disabled { background-color: #9d9d9d; cursor: not-allowed; box-shadow: none; }
        .btn-secondary { color: #6750A4; border-color: #79747E; } .btn-secondary:hover { background-color: rgba(103, 80, 164, 0.08); }
        .radio-group { display: flex; align-items: center; gap: 1.5rem; } .radio-group label { display: flex; align-items: center; cursor: pointer; font-size: 1rem; }
        .radio-group input[type="radio"] { display: none; }
        .radio-custom { width: 20px; height: 20px; border: 2px solid #79747E; border-radius: 50%; margin-right: 0.75rem; display: grid; place-items: center; transition: border-color 0.2s; }
        .radio-custom::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background-color: #6750A4; transform: scale(0); transition: transform 0.2s; }
        .peer:checked + .radio-custom { border-color: #6750A4; } .peer:checked + .radio-custom::before { transform: scale(1); }
      `}</style>
    </>
  );
}