"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Landmark, SeedVariety, FarmerDetails, Farm, BankAccount, Village } from '@/src/lib/definitions';
import { useDebounce } from '@/src/hooks/useDebounce';
import { FarmerSection, FarmerData, FarmData, BankAccountState } from '@/src/components/admin/cycles/new/FarmerSection';
import { SowingSection, CycleData } from '@/src/components/admin/cycles/new/SowingSection';
import { PaymentSection } from '@/src/components/admin/cycles/new/PaymentSection';
import { Trash2, UploadCloud, AlertCircle } from 'lucide-react';
import { bulkCreateCycles, QueuedCycle } from './batch-actions';

type FormProps = {
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
  villages: Village[];
  initialSeedPrice: number;
};

export function NewCycleForm({ landmarks, seedVarieties, villages, initialSeedPrice }: FormProps) {
  const [queue, setQueue] = useState<QueuedCycle[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean, message: string} | null>(null);

  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[]>([]);
  const [existingFarms, setExistingFarms] = useState<Farm[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);

  const [farmerData, setFarmerData] = useState<FarmerData>({ id: '', name: '', mobile: '', aadhar: '', address: '' });
  const [farmData, setFarmData] = useState<FarmData>({ id: '', location: '', area: '', villageId: '' });
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [newBankAccounts, setNewBankAccounts] = useState<BankAccountState[]>([{ id: '', name: '', confirmName: '', number: '', ifsc: '', bankName: '' }]);
  
  const [cycleData, setCycleData] = useState<CycleData>({
      landmarkId: '', 
      seedId: '', 
      bags: 0, 
      date: new Date().toISOString().split('T')[0],
      goods_collection_method: 'Farm', 
      paymentChoice: 'Paid', 
      amountPaid: 0,
      lot_no: '' // Initialize Lot No
  });

  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showNewFarmForm, setShowNewFarmForm] = useState(false);
  const [showNewBankAccountForm, setShowNewBankAccountForm] = useState(false);

  const debouncedSearch = useDebounce(farmerData.mobile, 300);
  const totalCost = useMemo(() => cycleData.bags * initialSeedPrice, [cycleData.bags, initialSeedPrice]);

  useEffect(() => {
      const savedQueue = localStorage.getItem('sowingQueue');
      if (savedQueue) {
          try { setQueue(JSON.parse(savedQueue)); } catch (e) { console.error("Failed to load queue", e); }
      }
  }, []);

  useEffect(() => {
      localStorage.setItem('sowingQueue', JSON.stringify(queue));
  }, [queue]);

  const isFormValid = useMemo(() => {
    const isFarmerValid = farmerData.name && farmerData.mobile;
    const isFarmValid = (farmData.id || (farmData.location && farmData.area)) || selectedFarmId;
    const isCycleValid = cycleData.landmarkId && cycleData.seedId && cycleData.bags > 0;
    
    // Bank is optional if paid in cash/credit? Or mandatory? 
    // Keeping logic as is: needs valid bank selection OR new bank entry
    const isBankValid = 
        selectedAccountIds.length > 0 || 
        newBankAccounts.some(acc => 
            acc.name && 
            acc.number && 
            acc.ifsc && 
            acc.name === acc.confirmName 
        );

    return !!(isFarmerValid && isFarmValid && isBankValid && isCycleValid);
  }, [farmerData, farmData, newBankAccounts, cycleData, selectedFarmId, selectedAccountIds]);

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
    setNewBankAccounts([{ id: '', name: '', confirmName: '', number: '', ifsc: '', bankName: '' }]);
    // Reset Lot No
    setCycleData((prev: CycleData) => ({ ...prev, bags: 0, paymentChoice: 'Paid', amountPaid: 0, lot_no: '' })); 
    setExistingFarms([]); setExistingAccounts([]); setSelectedFarmId(''); setSelectedAccountIds([]);
    setShowNewFarmForm(false); setShowNewBankAccountForm(false); setIsSearchEnabled(false);
  }, []);

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
        
        newBankAccounts: newBankAccounts
            .filter(acc => acc.name && acc.number)
            .map((acc) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { confirmName, ...rest } = acc;
                return rest;
            }), 

        seedId: cycleData.seedId,
        bags: cycleData.bags,
        sowingDate: cycleData.date,
        goodsCollectionMethod: cycleData.goods_collection_method,
        paymentChoice: cycleData.paymentChoice as 'Paid' | 'Credit' | 'Partial',
        amountPaid: cycleData.amountPaid,
        totalCost: totalCost,
        // Add Lot No to Queue Item (Normalize to uppercase or null)
        lot_no: cycleData.lot_no.trim() ? cycleData.lot_no.trim().toUpperCase() : null
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
    setRowErrors({}); // Clear previous errors

    // Call the server action
    const result = await bulkCreateCycles(queue);
    setIsUploading(false);

    if (result.results) {
        // 1. Identify Successful IDs
        const successIds = new Set(
            result.results
                .filter(r => r.status === 'success')
                .map(r => r.tempId)
        );

        // 2. Identify Errors
        const newErrors: Record<string, string> = {};
        result.results.forEach(r => {
            if (r.status === 'error' && r.message) {
                newErrors[r.tempId] = r.message;
            }
        });
        setRowErrors(newErrors);

        // 3. Update Queue (Keep only failed items)
        const remainingQueue = queue.filter(item => !successIds.has(item.tempId));
        setQueue(remainingQueue);
        
        // 4. Update Local Storage immediately
        if (remainingQueue.length === 0) {
            localStorage.removeItem('sowingQueue');
        } else {
            localStorage.setItem('sowingQueue', JSON.stringify(remainingQueue));
        }

        // 5. Show Summary Status
        if (result.summary.failed === 0) {
            setUploadStatus({ success: true, message: "All items uploaded successfully!" });
        } else {
            setUploadStatus({ 
                success: false, 
                message: `Batch complete: ${result.summary.success} uploaded, ${result.summary.failed} failed. Check rows below.` 
            });
        }
    } else {
        // Fallback for critical failures
        setUploadStatus({ success: false, message: "Critical Server Error" });
    }
};

  const villageOptions = villages.map(v => ({ value: String(v.village_id), label: v.village_name }));
  const landmarkOptions = landmarks.map(l => ({ value: String(l.landmark_id), label: l.landmark_name }));
  const seedVarietyOptions = seedVarieties.map(s => ({ value: String(s.seed_id), label: s.variety_name }));

  return (
    <div className="max-w-7xl mx-auto my-4 space-y-8">
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
                isFormValid={isFormValid}
                onAddToQueue={handleAddToQueue} 
            />
        </div>
      </div>

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
                 <p className="text-on-surface-variant/60">No entries in queue. Fill the form above and click &quot;Add to Queue&quot;.</p>
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
                         {queue.map((item) => {
    const error = rowErrors[item.tempId]; // Check if this row has an error

    return (
        <tr 
            key={item.tempId} 
            className={`transition-colors border-b border-outline/10 
                ${error ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-surface-container/30'}
            `}
        >
            <td className="p-3 font-medium text-on-surface">
                {item.farmerName}
                {/* [ADD] Error Message Display */}
                {error && (
                    <div className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </div>
                )}
            </td>
            <td className="p-3 text-on-surface-variant">{item.mobileNumber}</td>
            <td className="p-3 text-on-surface-variant">
                {item.locationName}
                {item.lot_no && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {item.lot_no}
                    </span>
                )}
            </td>
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
    );
})}
                     </tbody>
                 </table>
             </div>
         )}
      </div>
    </div>
  );
}