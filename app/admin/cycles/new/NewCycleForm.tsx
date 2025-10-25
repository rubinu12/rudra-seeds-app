// app/admin/cycles/new/NewCycleForm.tsx
"use client";

import { useState, useEffect, useActionState, useMemo } from 'react';
import { Landmark, SeedVariety, FarmerDetails, Farm, BankAccount, Village } from '@/lib/definitions';
import { createOrUpdateCycle } from './actions';
import { useDebounce } from '@/hooks/useDebounce';
import { FarmerSection } from '@/components/admin/cycles/new/FarmerSection';
import { SowingSection } from '@/components/admin/cycles/new/SowingSection';
import { PaymentSection } from '@/components/admin/cycles/new/PaymentSection';

type FormProps = {
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
  villages: Village[];
  initialSeedPrice: number;
};

export function NewCycleForm({ landmarks, seedVarieties, villages, initialSeedPrice }: FormProps) {
  const [state, formAction] = useActionState(createOrUpdateCycle, { message: '', success: false });

  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[]>([]);
  const [existingFarms, setExistingFarms] = useState<Farm[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);

  const [farmerData, setFarmerData] = useState({ id: '', name: '', mobile: '', aadhar: '', address: '' });
  const [farmData, setFarmData] = useState({ id: '', location: '', area: '', villageId: '' });
  const [newBankAccounts, setNewBankAccounts] = useState([{ id: '', name: '', number: '', ifsc: '', bankName: '' }]);

  // --- CORRECTION 1: Initialize state with goods_collection_method ---
  const [cycleData, setCycleData] = useState({
      landmarkId: '',
      seedId: '',
      bags: 0,
      date: new Date().toISOString().split('T')[0],
      goods_collection_method: 'Farm', // Changed from 'collection'
      paymentChoice: 'Paid',
      amountPaid: 0
  });

  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const [showNewFarmForm, setShowNewFarmForm] = useState(false);
  const [showNewBankAccountForm, setShowNewBankAccountForm] = useState(false);


  const debouncedSearch = useDebounce(farmerData.mobile, 300);

  const totalCost = useMemo(() => cycleData.bags * initialSeedPrice, [cycleData.bags, initialSeedPrice]);
  const isFormValid = useMemo(() => {
    const isFarmerValid = farmerData.name && farmerData.mobile && farmerData.aadhar && farmerData.address;
    const isFarmValid = (farmData.id || (farmData.location && farmData.area)) || selectedFarmId;
    const isBankValid = newBankAccounts.some(acc => acc.name && acc.number && acc.ifsc) || selectedAccountIds.length > 0;
    const isCycleValid = cycleData.landmarkId && cycleData.seedId && cycleData.bags > 0;

    if (cycleData.paymentChoice === 'Partial' && (!cycleData.amountPaid || cycleData.amountPaid <= 0 || cycleData.amountPaid >= totalCost)) {
        return false;
    }

    return !!(isFarmerValid && isFarmValid && isBankValid && isCycleValid);
  }, [farmerData, farmData, newBankAccounts, cycleData, selectedFarmId, selectedAccountIds, totalCost]);

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

  const handleSelectFarmer = async (f: Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>) => {
    setSearchResults([]);
    setIsLoading(true);
    const res = await fetch(`/api/farmers/${f.farmer_id}/details`);
    const details: FarmerDetails = await res.json();
    setFarmerData({ id: String(details.farmer_id), name: details.name, mobile: details.mobile_number, aadhar: details.aadhar_number, address: details.home_address });
    setExistingFarms(details.farms || []);
    setExistingAccounts(details.bank_accounts || []);
    if (details.farms?.[0]) setSelectedFarmId(String(details.farms[0].farm_id)); else setSelectedFarmId('');
    if (details.bank_accounts?.[0]) setSelectedAccountIds([String(details.bank_accounts[0].account_id)]); else setSelectedAccountIds([]);
    setShowNewFarmForm(false); setShowNewBankAccountForm(false); setNewBankAccounts([]);
    setIsLoading(false);
  };

  const handleClear = () => {
    setFarmerData({ id: '', name: '', mobile: '', aadhar: '', address: '' });
    setFarmData({ id: '', location: '', area: '', villageId: '' });
    setNewBankAccounts([{ id: '', name: '', number: '', ifsc: '', bankName: '' }]);
    // --- CORRECTION (Consistency): Reset goods_collection_method ---
    setCycleData({ landmarkId: '', seedId: '', bags: 0, date: new Date().toISOString().split('T')[0], goods_collection_method: 'Farm', paymentChoice: 'Paid', amountPaid: 0 });
    setExistingFarms([]); setExistingAccounts([]); setSelectedFarmId(''); setSelectedAccountIds([]);
    setShowNewFarmForm(false); setShowNewBankAccountForm(false); setIsSearchEnabled(false);
  };

  const addBankAccount = () => setNewBankAccounts(prev => [...prev, { id: '', name: '', number: '', ifsc: '', bankName: '' }]);

  const handleToggleNewFarmForm = () => {
      setShowNewFarmForm(prev => {
          const isShowing = !prev;
          if (isShowing) { setSelectedFarmId(''); }
          else if (existingFarms.length > 0) { setSelectedFarmId(String(existingFarms[0].farm_id)); }
          return isShowing;
      });
  };

  const handleToggleNewAccountForm = () => {
      setShowNewBankAccountForm(prev => {
          if (!prev) { setNewBankAccounts([{ id: '', name: '', number: '', ifsc: '', bankName: '' }]); }
          else { setNewBankAccounts([]); }
          return !prev;
      });
  };

  const triggerServerAction = () => {
    const dataToSubmit = new FormData();
    dataToSubmit.set('farmer_id', farmerData.id);
    dataToSubmit.set('farmer_name', farmerData.name);
    dataToSubmit.set('mobile_number', farmerData.mobile);
    dataToSubmit.set('aadhar_number', farmerData.aadhar);
    dataToSubmit.set('home_address', farmerData.address);
    dataToSubmit.set('farm_id', selectedFarmId || farmData.id);
    dataToSubmit.set('farm_address', farmData.location);
    dataToSubmit.set('area_in_vigha', farmData.area);
    dataToSubmit.set('village_id', farmData.villageId);

    dataToSubmit.set('bank_account_ids', JSON.stringify(selectedAccountIds));
    dataToSubmit.set('new_bank_accounts', JSON.stringify(newBankAccounts.filter(acc => acc.name && acc.number)));

    dataToSubmit.set('landmark_id', cycleData.landmarkId);
    dataToSubmit.set('seed_id', cycleData.seedId);
    dataToSubmit.set('seed_bags_purchased', String(cycleData.bags));
    dataToSubmit.set('sowing_date', cycleData.date);
    // --- CORRECTION 2: Read from cycleData.goods_collection_method ---
    dataToSubmit.set('goods_collection_method', cycleData.goods_collection_method); // Changed from cycleData.collection
    dataToSubmit.set('payment_choice', cycleData.paymentChoice);
    dataToSubmit.set('total_cost', String(totalCost));
    dataToSubmit.set('amount_paid', String(cycleData.amountPaid));

    formAction(dataToSubmit);
  };

  const villageOptions = villages.map(v => ({ value: String(v.village_id), label: v.village_name }));
  const landmarkOptions = landmarks.map(l => ({ value: String(l.landmark_id), label: l.landmark_name }));
  const seedVarietyOptions = seedVarieties.map(s => ({ value: String(s.seed_id), label: s.variety_name }));

  return (
    <form action={triggerServerAction} className="max-w-7xl mx-auto my-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <FarmerSection
          farmerState={[farmerData, setFarmerData]}
          farmState={[farmData, setFarmData]}
          newBankAccounts={newBankAccounts}
          setNewBankAccounts={setNewBankAccounts}
          searchResults={searchResults}
          isLoading={isLoading}
          existingFarms={existingFarms}
          existingAccounts={existingAccounts}
          handleSelectFarmer={handleSelectFarmer}
          handleClear={handleClear}
          isSearchEnabled={isSearchEnabled}
          setIsSearchEnabled={setIsSearchEnabled}
          villageOptions={villageOptions}
          addBankAccount={addBankAccount}
          selectedFarmId={selectedFarmId}
          setSelectedFarmId={setSelectedFarmId}
          selectedAccountIds={selectedAccountIds}
          setSelectedAccountIds={setSelectedAccountIds}
          showNewFarmForm={showNewFarmForm}
          handleToggleNewFarmForm={handleToggleNewFarmForm}
          showNewBankAccountForm={showNewBankAccountForm}
          handleToggleNewAccountForm={handleToggleNewAccountForm}
        />
      </div>

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