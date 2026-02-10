// app/admin/cycles/new/NewCycleForm.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Landmark, SeedVariety, FarmerDetails, Farm, BankAccount, Village } from '@/src/lib/definitions';
import { useDebounce } from '@/src/hooks/useDebounce';
import { FarmerSection } from '@/src/components/admin/cycles/new/FarmerSection';
import { SowingSection } from '@/src/components/admin/cycles/new/SowingSection';
import { PaymentSection } from '@/src/components/admin/cycles/new/PaymentSection';
import { Trash2, UploadCloud, AlertCircle } from 'lucide-react';
import { bulkCreateCycles, QueuedCycle } from './batch-actions';
import { useRouter } from 'next/navigation';

type FormProps = {
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
  villages: Village[];
  initialSeedPrice: number;
};

export function NewCycleForm({ landmarks, seedVarieties, villages, initialSeedPrice }: FormProps) {
  // --- Queue State ---
  const [queue, setQueue] = useState<QueuedCycle[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean, message: string} | null>(null);
  const router = useRouter();

  // --- Form State ---
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[]>([]);
  const [existingFarms, setExistingFarms] = useState<Farm[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);

  const [farmerData, setFarmerData] = useState({ id: '', name: '', mobile: '', aadhar: '', address: '' });
  const [farmData, setFarmData] = useState({ id: '', location: '', area: '', villageId: '' });
  
  // *** UPDATED STATE: Added confirmName ***
  const [newBankAccounts, setNewBankAccounts] = useState([{ id: '', name: '', confirmName: '', number: '', ifsc: '', bankName: '' }]);
  
  const [cycleData, setCycleData] = useState({
      landmarkId: '', seedId: '', bags: 0, date: new Date().toISOString().split('T')[0],
      goods_collection_method: 'Farm', paymentChoice: 'Paid', amountPaid: 0
  });

  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showNewFarmForm, setShowNewFarmForm] = useState(false);
  const [showNewBankAccountForm, setShowNewBankAccountForm] = useState(false);

  const debouncedSearch = useDebounce(farmerData.mobile, 300);
  const totalCost = useMemo(() => cycleData.bags * initialSeedPrice, [cycleData.bags, initialSeedPrice]);

  // --- Load Queue from LocalStorage ---
  useEffect(() => {
      const savedQueue = localStorage.getItem('sowingQueue');
      if (savedQueue) {
          try { setQueue(JSON.parse(savedQueue)); } catch (e) { console.error("Failed to load queue", e); }
      }
  }, []);

  // --- Save Queue to LocalStorage ---
  useEffect(() => {
      localStorage.setItem('sowingQueue', JSON.stringify(queue));
  }, [queue]);

  // --- Validations ---
  const isFormValid = useMemo(() => {
    const isFarmerValid = farmerData.name && farmerData.mobile;
    const isFarmValid = (farmData.id || (farmData.location && farmData.area)) || selectedFarmId;
    const isCycleValid = cycleData.landmarkId && cycleData.seedId && cycleData.bags > 0;
    
    // *** NEW SECURITY CHECK: Verify names match for all new accounts ***
    const isBankValid = 
        selectedAccountIds.length > 0 || 
        newBankAccounts.some(acc => 
            acc.name && 
            acc.number && 
            acc.ifsc && 
            acc.name === acc.confirmName // Must match exactly
        );

    return !!(isFarmerValid && isFarmValid && isBankValid && isCycleValid);
  }, [farmerData, farmData, newBankAccounts, cycleData, selectedFarmId, selectedAccountIds]);

  // --- Search Logic ---
  useEffect(() => {
    if (isSearchEnabled && debouncedSearch && !farmerData.id) {
      setIsLoading(true);
      fetch(`/api/farmers/search?query=${debouncedSearch}`)
        .then(res => res.json())
        .then(data => setSearchResults(data))
        .finally(() => setIsLoading(false));
    } else { setSearchResults([]); }
  }, [debouncedSearch, farmerData.id, isSearchEnabled]);

  const handleSelectFarmer = async (f: Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>) => {
    setSearchResults([]); setIsLoading(true);
    const res = await fetch(`/api/farmers/${f.farmer_id}/details`);
    const details: FarmerDetails = await res.json();
    setFarmerData({ id: String(details.farmer_id), name: details.name, mobile: details.mobile_number, aadhar: details.aadhar_number, address: details.home_address });
    setExistingFarms(details.farms || []);
    setExistingAccounts(details.bank_accounts || []);
    if (details.farms?.[0]) setSelectedFarmId(String(details.farms[0].farm_id));
    if (details.bank_accounts?.[0]) setSelectedAccountIds([String(details.bank_accounts[0].account_id)]);
    setShowNewFarmForm(false); setShowNewBankAccountForm(false); setNewBankAccounts([]);
    setIsLoading(false);
  };

  const handleClearForm = useCallback(() => {
    setFarmerData({ id: '', name: '', mobile: '', aadhar: '', address: '' });
    setFarmData({ id: '', location: '', area: '', villageId: '' });
    
    // Reset bank accounts with confirmName
    setNewBankAccounts([{ id: '', name: '', confirmName: '', number: '', ifsc: '', bankName: '' }]);
    
    setCycleData(prev => ({ ...prev, bags: 0, paymentChoice: 'Paid', amountPaid: 0 })); 
    setExistingFarms([]); setExistingAccounts([]); setSelectedFarmId(''); setSelectedAccountIds([]);
    setShowNewFarmForm(false); setShowNewBankAccountForm(false); setIsSearchEnabled(false);
  }, []);

  // --- QUEUE ACTIONS ---
  const handleAddToQueue = () => {
    if (!isFormValid) return;

    const newItem: QueuedCycle = {
        tempId: Date.now().toString(),
        farmerId: farmerData.id || null,
        farmerName: farmerData.name,
        mobileNumber: farmerData.mobile,
        aadharNumber: farmerData.aadhar,
        homeAddress: farmerData.address,
        farmId: selectedFarmId || null,
        locationName: farmData.location,
        areaInVigha: Number(farmData.area),
        villageId: farmData.villageId,
        landmarkId: cycleData.landmarkId,
        selectedAccountIds: selectedAccountIds,
        
        // *** CLEANUP: Remove 'confirmName' before saving to queue ***
        newBankAccounts: newBankAccounts
            .filter(acc => acc.name && acc.number)
            .map(({ confirmName, ...rest }) => rest), 

        seedId: cycleData.seedId,
        bags: cycleData.bags,
        sowingDate: cycleData.date,
        goodsCollectionMethod: cycleData.goods_collection_method,
        paymentChoice: cycleData.paymentChoice as any,
        amountPaid: cycleData.amountPaid,
        totalCost: totalCost
    };

    setQueue(prev => [...prev, newItem]);
    handleClearForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveFromQueue = (id: string) => {
      setQueue(prev => prev.filter(item => item.tempId !== id));
  };

  const handleUploadAll = async () => {
      if (queue.length === 0) return;
      setIsUploading(true);
      setUploadStatus(null);
      
      const result = await bulkCreateCycles(queue);
      
      setIsUploading(false);
      if (result.success) {
          setQueue([]);
          localStorage.removeItem('sowingQueue');
          setUploadStatus({ success: true, message: result.message });
      } else {
          setUploadStatus({ success: false, message: result.message });
      }
  };

  // Helper options
  const villageOptions = villages.map(v => ({ value: String(v.village_id), label: v.village_name }));
  const landmarkOptions = landmarks.map(l => ({ value: String(l.landmark_id), label: l.landmark_name }));
  const seedVarietyOptions = seedVarieties.map(s => ({ value: String(s.seed_id), label: s.variety_name }));

  return (
    <div className="max-w-7xl mx-auto my-4 space-y-8">
      
      {/* --- FORM AREA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <FarmerSection
                farmerState={[farmerData, setFarmerData]} farmState={[farmData, setFarmData]}
                newBankAccounts={newBankAccounts} setNewBankAccounts={setNewBankAccounts}
                searchResults={searchResults} isLoading={isLoading} existingFarms={existingFarms}
                existingAccounts={existingAccounts} handleSelectFarmer={handleSelectFarmer}
                handleClear={handleClearForm} isSearchEnabled={isSearchEnabled} setIsSearchEnabled={setIsSearchEnabled}
                villageOptions={villageOptions} addBankAccount={() => setNewBankAccounts(p => [...p, {id:'',name:'',confirmName:'',number:'',ifsc:'',bankName:''}])}
                selectedFarmId={selectedFarmId} setSelectedFarmId={setSelectedFarmId}
                selectedAccountIds={selectedAccountIds} setSelectedAccountIds={setSelectedAccountIds}
                showNewFarmForm={showNewFarmForm} handleToggleNewFarmForm={() => setShowNewFarmForm(p => !p)}
                showNewBankAccountForm={showNewBankAccountForm} handleToggleNewAccountForm={() => setShowNewBankAccountForm(p => !p)}
            />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky top-6 h-min">
            <SowingSection cycleState={[cycleData, setCycleData]} landmarkOptions={landmarkOptions} seedVarietyOptions={seedVarietyOptions} />
            
            <PaymentSection 
                cycleState={[cycleData, setCycleData]}
                totalCost={totalCost}
                seedPrice={initialSeedPrice}
                isFormValid={isFormValid}
                handleClear={handleClearForm}
                state={{ message: '', success: false }} 
                onAddToQueue={handleAddToQueue} 
            />
        </div>
      </div>

      {/* --- QUEUE AREA --- */}
      <div className="bg-surface rounded-3xl shadow-sm border border-outline/20 p-6 md:p-8 animate-fadeIn">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-medium text-on-surface">Pending Entries ({queue.length})</h2>
                <p className="text-on-surface-variant">Review your batch before uploading to the database.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setQueue([])}
                    className="px-4 py-2 text-error hover:bg-error-container/20 rounded-lg transition-colors text-sm font-medium"
                >
                    Clear All
                </button>
                <button
                    onClick={handleUploadAll}
                    disabled={queue.length === 0 || isUploading}
                    className="px-6 py-2 bg-primary-container text-on-primary-container hover:bg-primary/20 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                    {isUploading ? <UploadCloud className="w-5 h-5 animate-bounce" /> : <UploadCloud className="w-5 h-5" />}
                    {isUploading ? 'Uploading...' : queue.length === 1 ? 'Upload Entry' : `Upload All (${queue.length})`}
                </button>
            </div>
         </div>

         {uploadStatus && (
             <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                 <AlertCircle className="w-5 h-5" />
                 <p>{uploadStatus.message}</p>
             </div>
         )}

         {queue.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed border-outline/20 rounded-2xl bg-surface-container/30">
                 <p className="text-on-surface-variant/60">No entries in queue. Fill the form above and click "Add to Queue".</p>
             </div>
         ) : (
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-surface-container text-on-surface-variant font-medium">
                         <tr>
                             <th className="p-3 rounded-l-lg">Farmer</th>
                             <th className="p-3">Mobile</th>
                             <th className="p-3">Location</th>
                             <th className="p-3">Seed</th>
                             <th className="p-3 text-right">Bags</th>
                             <th className="p-3 text-right">Total</th>
                             <th className="p-3 rounded-r-lg text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-outline/10">
                         {queue.map((item, idx) => (
                             <tr key={item.tempId} className="hover:bg-surface-container/30 transition-colors">
                                 <td className="p-3 font-medium text-on-surface">{item.farmerName}</td>
                                 <td className="p-3 text-on-surface-variant">{item.mobileNumber}</td>
                                 <td className="p-3 text-on-surface-variant">{item.locationName}</td>
                                 <td className="p-3 text-on-surface-variant">
                                     {seedVarieties.find(s => String(s.seed_id) === item.seedId)?.variety_name || item.seedId}
                                 </td>
                                 <td className="p-3 text-right font-medium">{item.bags}</td>
                                 <td className="p-3 text-right">₹{item.totalCost}</td>
                                 <td className="p-3 text-center">
                                     <button 
                                        onClick={() => handleRemoveFromQueue(item.tempId)}
                                        className="p-2 hover:bg-error-container text-error rounded-full transition-colors"
                                        title="Remove entry"
                                     >
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}
      </div>
    </div>
  );
}