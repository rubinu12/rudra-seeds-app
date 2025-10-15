// @/components/admin/cycles/new/FarmerSection.tsx
"use client";
import { User, Tractor, Landmark, PlusCircle, LoaderCircle, X, Search } from 'lucide-react';
import type { FarmerDetails, Farm, BankAccount } from '@/lib/definitions';
import { Input, Textarea, Select } from '@/components/ui/FormInputs';
import SearchableSelect from '@/components/ui/SearchableSelect';

type Option = { value: string; label: string; };

type Props = {
    farmerState: [any, Function];
    farmState: [any, Function];
    bankState: [any, Function];
    searchResults: Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[];
    isLoading: boolean;
    existingFarms: Farm[];
    existingAccounts: BankAccount[];
    handleSelectFarmer: (farmer: any) => void;
    handleClear: () => void;
    isSearchEnabled: boolean;
    setIsSearchEnabled: (enabled: boolean) => void;
    villageOptions: Option[];
}

export const FarmerSection = ({
    farmerState, farmState, bankState, searchResults, isLoading,
    existingFarms, existingAccounts, handleSelectFarmer, handleClear,
    isSearchEnabled, setIsSearchEnabled, villageOptions
}: Props) => {
    const [farmerData, setFarmerData] = farmerState;
    const [farmData, setFarmData] = farmState;
    const [bankData, setBankData] = bankState;

    const handleFarmerChange = (e: React.ChangeEvent<any>) => {
        setFarmerData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFarmChange = (e: React.ChangeEvent<any>) => {
        setFarmData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleBankChange = (e: React.ChangeEvent<any>) => {
        setBankData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <>
            {/* --- Farmer & Farm Details Card --- */}
            <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
                {/* --- HEADER WITH CORRECTED TOGGLE --- */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 grid place-items-center rounded-2xl bg-primary-container shrink-0">
                            <User className="w-6 h-6 text-on-primary-container" />
                        </div>
                        <h2 className="text-[1.75rem] font-normal text-on-surface">Farmer & Farm Details</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                         <Search className="w-5 h-5 text-on-surface-variant"/>
                         <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="search-toggle"
                                className="sr-only peer"
                                checked={isSearchEnabled}
                                // This is the critical line that makes the toggle work
                                onChange={(e) => setIsSearchEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-outline rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative md:col-span-2">
                        {/* This label will now correctly change when the toggle is clicked */}
                        <Input type="tel" id="mobile" name="mobile" label={isSearchEnabled ? "Search by Phone No." : "Phone No."} value={farmerData.mobile} onChange={handleFarmerChange} required readOnly={!!farmerData.id} />
                        <div className="absolute top-0 right-4 h-full flex items-center z-10">
                            {isLoading && <LoaderCircle className="animate-spin text-on-surface-variant" />}
                            {farmerData.id && <button type="button" onClick={handleClear} className="p-1 rounded-full hover:bg-black/10"><X className="text-on-surface-variant"/></button>}
                        </div>
                        {isSearchEnabled && searchResults.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-surface-container border border-outline rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map((f) => (<div key={f.farmer_id} onClick={() => handleSelectFarmer(f)} className="px-4 py-3 cursor-pointer hover:bg-primary/10"><p className="font-medium text-on-surface">{f.name}</p><p className="text-sm text-on-surface-variant">{f.mobile_number}</p></div>))}
                            </div>
                        )}
                    </div>
                    <Input type="text" id="name" name="name" label="Name of Farmer" value={farmerData.name} onChange={handleFarmerChange} required />
                    <Input type="text" id="aadhar" name="aadhar" label="Aadhar No. of Farmer" value={farmerData.aadhar} onChange={handleFarmerChange} required />
                    <Textarea id="address" name="address" label="Home Address" value={farmerData.address} onChange={handleFarmerChange} required className="md:col-span-2" />
                </div>
            </div>

            {/* --- Farm Details Card (Unchanged) --- */}
            <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 grid place-items-center rounded-2xl bg-tertiary-container">
                        <Tractor className="w-6 h-6 text-on-tertiary-container" />
                    </div>
                    <h2 className="text-[1.75rem] font-normal text-on-surface">Farm Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SearchableSelect id="villageId" name="villageId" label="Village" options={villageOptions} value={farmData.villageId} onChange={(value) => setFarmData((prev: any) => ({ ...prev, villageId: value }))} />
                    <Input type="number" id="area" name="area" label="Area of Farm (Vigha)" value={farmData.area} onChange={handleFarmChange} required />
                    <Textarea id="location" name="location" label="Farm Address" value={farmData.location} onChange={handleFarmChange} required className="md:col-span-2" />
                </div>
            </div>

            {/* --- Bank Details Card (Unchanged) --- */}
            <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 grid place-items-center rounded-2xl bg-primary-container">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21005D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <h2 className="text-[1.75rem] font-normal text-on-surface">Bank Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="text" id="name_bank" name="name" label="Name in Bank Account" value={bankData.name} onChange={handleBankChange} required />
                    <Input type="text" id="name_confirm" name="name_confirm" label="Confirm Name" value={bankData.name} onChange={handleBankChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <Input type="text" id="number" name="number" label="Bank Account No." value={bankData.number} onChange={handleBankChange} required />
                    <Input type="text" id="ifsc" name="ifsc" label="IFSC Code" value={bankData.ifsc} onChange={handleBankChange} required />
                    <Input type="text" id="bankName" name="bankName" label="Bank Name" value={bankData.bankName} onChange={handleBankChange} required />
                </div>
                <div className="flex justify-end mt-6">
                    <button type="button" className="inline-flex items-center justify-center px-6 py-3 border border-outline text-primary font-medium rounded-full hover:bg-primary/10 transition-colors">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add Another Account
                    </button>
                </div>
            </div>
        </>
    )
}