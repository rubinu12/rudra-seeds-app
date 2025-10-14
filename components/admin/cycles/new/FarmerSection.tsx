// @/components/admin/cycles/new/FarmerSection.tsx
"use client";
import { User, Tractor, Landmark, PlusCircle, LoaderCircle, X } from 'lucide-react';
import type { FarmerDetails, Farm, BankAccount } from '@/lib/definitions';
import { Input, Textarea, Select } from '@/components/ui/FormInputs';

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
}

export const FarmerSection = ({ farmerState, farmState, bankState, searchResults, isLoading, existingFarms, existingAccounts, handleSelectFarmer, handleClear }: Props) => {
    const [farmerData, setFarmerData] = farmerState;
    const [farmData, setFarmData] = farmState;
    const [bankData, setBankData] = bankState;

    const handleChange = (setter: Function, field: string) => (e: React.ChangeEvent<any>) => {
        setter((prev: any) => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <>
            <div className="form-section-card">
                <div className="section-header"><div className="icon-container bg-primary-container"><User className="w-6 h-6 text-on-primary-container" /></div><h2 className="section-title">Farmer & Farm Details</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative md:col-span-2">
                        <Input type="tel" id="mobile" name="mobile" label="Phone No. (Search or Add New)" value={farmerData.mobile} onChange={handleChange(setFarmerData, 'mobile')} required readOnly={!!farmerData.id} />
                        <div className="absolute top-0 right-4 h-full flex items-center z-10">
                            {isLoading && <LoaderCircle className="animate-spin text-on-surface-variant" />}
                            {farmerData.id && <button type="button" onClick={handleClear} className="p-1 rounded-full hover:bg-black/10"><X className="text-on-surface-variant"/></button>}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-surface-container border border-outline rounded-lg shadow-lg">
                                {searchResults.map((f) => (<div key={f.farmer_id} onClick={() => handleSelectFarmer(f)} className="px-4 py-3 cursor-pointer hover:bg-primary/10"><p className="font-medium text-on-surface">{f.name}</p><p className="text-sm text-on-surface-variant">{f.mobile_number}</p></div>))}
                            </div>
                        )}
                    </div>
                    <Input type="text" id="name" name="name" label="Name of Farmer" value={farmerData.name} onChange={handleChange(setFarmerData, 'name')} required />
                    <Input type="text" id="village" name="village" label="Village of Farmer" value={farmerData.village} onChange={handleChange(setFarmerData, 'village')} required />
                    <Input type="text" id="aadhar" name="aadhar" label="Adhar No. of Farmer" value={farmerData.aadhar} onChange={handleChange(setFarmerData, 'aadhar')} required className="md:col-span-2" />
                    <Textarea id="address" name="address" label="Home Address" rows={3} value={farmerData.address} onChange={handleChange(setFarmerData, 'address')} required className="md:col-span-2 h-28" />
                </div>
            </div>
            
            {farmerData.id && existingFarms.length > 0 ? (
                <div className="form-section-card"><div className="section-header"><div className="icon-container bg-green-200"><Tractor className="w-6 h-6 text-green-800" /></div><h2 className="section-title">Select Farm</h2></div><Select id="id" name="id" label="Choose an existing farm" value={farmData.id} onChange={handleChange(setFarmData, 'id')}><>{existingFarms.map(f => (<option key={f.farm_id} value={f.farm_id}>{f.location_name} ({f.area_in_vigha} Vigha)</option>))}<option value="">Add as a new farm...</option></></Select></div>
            ) : (
                <div className="form-section-card"><div className="section-header"><div className="icon-container bg-green-200"><PlusCircle className="w-6 h-6 text-green-800" /></div><h2 className="section-title">Add New Farm</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input type="text" id="location" name="location" label="Farm Address / Location" value={farmData.location} onChange={handleChange(setFarmData, 'location')} required /><Input type="number" id="area" name="area" label="Area of Farm (Vigha)" value={farmData.area} onChange={handleChange(setFarmData, 'area')} required /></div></div>
            )}
            {farmerData.id && existingAccounts.length > 0 ? (
                <div className="form-section-card"><div className="section-header"><div className="icon-container bg-blue-200"><Landmark className="w-6 h-6 text-blue-800" /></div><h2 className="section-title">Select Bank Account</h2></div><Select id="id" name="id" label="Choose an existing account" value={bankData.id} onChange={handleChange(setBankData, 'id')}><>{existingAccounts.map(acc => (<option key={acc.account_id} value={acc.account_id}>{acc.account_name} - (**** {acc.account_no.slice(-4)})</option>))}<option value="">Add as a new account...</option></></Select></div>
            ) : (
                <div className="form-section-card"><div className="section-header"><div className="icon-container bg-blue-200"><PlusCircle className="w-6 h-6 text-blue-800" /></div><h2 className="section-title">Add Bank Details</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input type="text" id="name" name="name" label="Name in Bank Account" value={bankData.name} onChange={handleChange(setBankData, 'name')} required /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"><Input type="text" id="number" name="number" label="Bank Account No." value={bankData.number} onChange={handleChange(setBankData, 'number')} required /><Input type="text" id="ifsc" name="ifsc" label="IFSC Code" value={bankData.ifsc} onChange={handleChange(setBankData, 'ifsc')} required /><Input type="text" id="bankName" name="bankName" label="Bank Name" value={bankData.bankName} onChange={handleChange(setBankData, 'bankName')} required /></div></div>
            )}
        </>
    )
}