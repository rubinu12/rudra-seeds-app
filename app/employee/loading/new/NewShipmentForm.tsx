// app/employee/harvesting/loading/new/NewShipmentForm.tsx
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';
import { MasterDataItem, ShipmentCompanySetting } from '@/app/admin/settings/data';
import { Input, Select } from '@/components/ui/FormInputs';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { Truck, ArrowRight, ArrowLeft, Package, Plus, Trash2, Phone, MapPin, Tag } from 'lucide-react';

// Props expected from the server component
type NewShipmentFormProps = {
    transportCompanies: ShipmentCompanySetting[];
    destinationCompanies: MasterDataItem[];
    cyclesReadyForLoading: CropCycleForEmployeeWeighing[];
};

// State for vehicle details (from Step 1)
type VehicleDetails = {
    transportCompanyId: string;
    vehicleNo: string;
    capacityTonnes: string;
    driverMobile: string;
    destinationCompanyId: string;
};

// Type for items selected to be loaded
type SelectedItem = {
    crop_cycle_id: number;
    bags_loaded: number;
    farmer_name: string; // For display
    lot_no: string | null; // For display
};

// Define Collection Methods for filtering
type CollectionMethod = 'All' | 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard';
const collectionMethods: CollectionMethod[] = ['Farm', 'Parabadi yard', 'Dhoraji yard', 'Jalasar yard']; // Removed 'All' as a filter option here
const collectionMethodLabels: Record<CollectionMethod, string> = {
    'All': 'બધા', // Keep for potential future use if needed elsewhere
    'Farm': 'ખેતર',
    'Parabadi yard': 'પરબડી યાર્ડ',
    'Dhoraji yard': 'ધોરાજી યાર્ડ',
    'Jalasar yard': 'જાળાસર યાર્ડ'
};


export function NewShipmentForm({
    transportCompanies,
    destinationCompanies,
    cyclesReadyForLoading
}: NewShipmentFormProps) {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
        transportCompanyId: '', vehicleNo: '', capacityTonnes: '',
        driverMobile: '', destinationCompanyId: '',
    });
    const [step1Error, setStep1Error] = useState<string>('');

    // --- State for Step 2 ---
    const [locationFilter, setLocationFilter] = useState<CollectionMethod>('Farm'); // Default filter
    const [bagsToLoadInputs, setBagsToLoadInputs] = useState<Record<number, string>>({}); // { cycleId: "bagsString" }
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [step2Error, setStep2Error] = useState<string>('');

    // --- Capacity Calculation ---
    const TONNES_TO_BAGS_MULTIPLIER = 20;
    const bagCapacity = useMemo(() => {
        const tonnes = parseFloat(vehicleDetails.capacityTonnes);
        return (!isNaN(tonnes) && tonnes > 0) ? Math.floor(tonnes * TONNES_TO_BAGS_MULTIPLIER) : 0;
    }, [vehicleDetails.capacityTonnes]);

    const totalBagsLoaded = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + item.bags_loaded, 0);
    }, [selectedItems]);

    const remainingCapacity = useMemo(() => bagCapacity - totalBagsLoaded, [bagCapacity, totalBagsLoaded]);

    // --- Input Change Handlers ---
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setVehicleDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (step1Error) setStep1Error('');
    };

    const handleBagsInputChange = (cycleId: number, value: string) => {
        // Allow only non-negative integers
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setBagsToLoadInputs(prev => ({ ...prev, [cycleId]: sanitizedValue }));
         if (step2Error) setStep2Error(''); // Clear error on input change
    };

    // --- Step 1 Validation ---
    const validateStep1 = (): boolean => {
        // (Validation logic remains the same as before)
         if (!vehicleDetails.transportCompanyId) { setStep1Error('Please select a Transport Company.'); return false; }
         if (!vehicleDetails.vehicleNo.trim()) { setStep1Error('Please enter the Vehicle Number.'); return false; }
         const capacity = parseFloat(vehicleDetails.capacityTonnes);
         if (isNaN(capacity) || capacity <= 0) { setStep1Error('Please enter a valid positive Capacity in Tonnes.'); return false; }
         if (!vehicleDetails.destinationCompanyId) { setStep1Error('Please select a Destination Company.'); return false; }
        setStep1Error('');
        return true;
    };

    // --- Navigation Handlers ---
    const handleNextStep = () => {
        if (validateStep1()) {
            console.log("Step 1 Validated. Proceeding to Step 2.");
            setCurrentStep(2);
        }
    };
    const handlePrevStep = () => setCurrentStep(1);

    // --- Step 2 Logic ---
    const filteredCycles = useMemo(() => {
        return cyclesReadyForLoading.filter(cycle => cycle.goods_collection_method === locationFilter);
    }, [cyclesReadyForLoading, locationFilter]);

    const handleAddItem = (cycle: CropCycleForEmployeeWeighing) => {
        setStep2Error(''); // Clear previous errors
        const bagsToLoadStr = bagsToLoadInputs[cycle.crop_cycle_id] || '';
        const bagsToLoadNum = parseInt(bagsToLoadStr, 10);
        const bagsRemainingOnCycle = cycle.bags_remaining_to_load ?? 0;

        // Validation
        if (isNaN(bagsToLoadNum) || bagsToLoadNum <= 0) {
            setStep2Error(`Enter a valid number of bags for ${cycle.farmer_name}.`);
            return;
        }
        if (bagsToLoadNum > bagsRemainingOnCycle) {
            setStep2Error(`Cannot load ${bagsToLoadNum} bags. Only ${bagsRemainingOnCycle} remaining for ${cycle.farmer_name}.`);
            return;
        }
        if (bagsToLoadNum > remainingCapacity) {
            setStep2Error(`Cannot add ${bagsToLoadNum} bags. Exceeds vehicle capacity (${remainingCapacity} bags left).`);
            return;
        }

        // Add item to selected list
                setSelectedItems(prev => [
                    ...prev,
                    {
                        crop_cycle_id: cycle.crop_cycle_id,
                        bags_loaded: bagsToLoadNum,
                        farmer_name: cycle.farmer_name,
                        lot_no: cycle.lot_no ?? null,
                    }
                ]);
        
                // Clear the input field for this cycle
                handleBagsInputChange(cycle.crop_cycle_id, '');
                console.log(`Added ${bagsToLoadNum} bags for cycle ${cycle.crop_cycle_id}`);
    };

    const handleRemoveItem = (cycleIdToRemove: number) => {
        setSelectedItems(prev => prev.filter(item => item.crop_cycle_id !== cycleIdToRemove));
        console.log(`Removed item for cycle ${cycleIdToRemove}`);
    };

    const handleConfirmDispatch = () => {
        // --- TODO: Implement Server Action Call ---
        console.log("Dispatch Confirmed!");
        console.log("Vehicle Details:", vehicleDetails);
        console.log("Selected Items:", selectedItems);
        // Prepare FormData including JSON string of selectedItems
        // Call server action: createShipment(formData)
        // Handle response (success/error)
        alert("Dispatch functionality not yet fully implemented. Check console for data.");
    };

    // --- Options ---
    const transportOptions = transportCompanies.map(c => ({ value: String(c.id), label: c.name }));
    const destinationOptions = destinationCompanies.map(c => ({ value: String(c.id), label: c.name }));

    return (
        <div className="bg-surface-container rounded-3xl p-6 shadow-md border border-outline/30 space-y-6">

            {/* Step Indicator */}
            {/* (Indicator code remains the same) */}
             <div className="flex justify-center items-center space-x-2 mb-6"> <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>1</div> <div className={`flex-grow h-1 ${currentStep > 1 ? 'bg-primary' : 'bg-surface-variant'}`}></div> <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>2</div> </div>

            {/* --- Step 1: Vehicle Details --- */}
            {currentStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                    <div className="flex items-center gap-3 mb-4"> <Truck className="w-6 h-6 text-primary" /> <h2 className="text-xl font-medium text-on-surface">Vehicle Details</h2> </div>
                    <SearchableSelect id="transportCompanyId" name="transportCompanyId" label="Transport Company" options={transportOptions} value={vehicleDetails.transportCompanyId} onChange={(value) => handleDetailChange({ target: { name: 'transportCompanyId', value } } as any)} />
                    <Input id="vehicleNo" name="vehicleNo" label="Vehicle No." value={vehicleDetails.vehicleNo} onChange={handleDetailChange} required className="uppercase" autoCapitalize="characters" />
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <Input id="capacityTonnes" name="capacityTonnes" label="Capacity (Tonnes)" type="number" step="0.1" min="0" value={vehicleDetails.capacityTonnes} onChange={handleDetailChange} required />
                        <div className="bg-secondary-container/30 text-on-secondary-container text-sm font-medium h-[56px] flex items-center justify-center rounded-xl px-3 text-center mb-[2px]"> <Package size={16} className="mr-1.5 opacity-80" /> ~ {bagCapacity} Bags </div>
                    </div>
                    <Input id="driverMobile" name="driverMobile" label="Driver Mobile (Optional)" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={vehicleDetails.driverMobile} onChange={handleDetailChange} />
                    <SearchableSelect id="destinationCompanyId" name="destinationCompanyId" label="Destination Company" options={destinationOptions} value={vehicleDetails.destinationCompanyId} onChange={(value) => handleDetailChange({ target: { name: 'destinationCompanyId', value } } as any)} />
                    {step1Error && ( <p className="text-sm text-error text-center font-medium">{step1Error}</p> )}
                    <div className="pt-4"> <button type="button" onClick={handleNextStep} className="w-full h-[50px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"> Next <ArrowRight className="w-5 h-5" /> </button> </div>
                </div>
            )}

            {/* --- Step 2: Load Items --- */}
            {currentStep === 2 && (
                <div className="animate-fadeIn space-y-6">
                     <div className="flex items-center gap-3 mb-4"> <Package className="w-6 h-6 text-primary" /> <h2 className="text-xl font-medium text-on-surface">Load Items</h2> </div>

                     {/* Location Filter Dropdown */}
                     <Select
                        id="locationFilter"
                        name="locationFilter"
                        label="Filter by Collection Location"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value as CollectionMethod)}
                    >
                         {collectionMethods.map(method => (
                            <option key={method} value={method}>{collectionMethodLabels[method]}</option>
                         ))}
                    </Select>

                    {/* List of Cycles to Load */}
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 -mr-2 border-t border-b border-outline/20 py-4">
                        {filteredCycles.length > 0 ? (
                            filteredCycles.map(cycle => (
                                <div key={cycle.crop_cycle_id} className="bg-surface p-4 rounded-xl border border-outline/20 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-on-surface">{cycle.farmer_name}</p>
                                            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5"><Tag size={12}/>{cycle.lot_no || 'No Lot#'}</p>
                                            <p className="text-xs text-on-surface-variant flex items-center gap-1"><MapPin size={12}/>{cycle.village} ({cycle.landmark_name || 'N/A'})</p>
                                        </div>
                                         {cycle.mobile_number && (
                                            <a href={`tel:${cycle.mobile_number}`} className="flex-shrink-0 ml-2 mt-1 p-2 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors" aria-label={`Call ${cycle.farmer_name}`}>
                                                <Phone className="w-4 h-4" />
                                            </a>
                                         )}
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow">
                                            <Input
                                                id={`bags_${cycle.crop_cycle_id}`}
                                                name={`bags_${cycle.crop_cycle_id}`}
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                label={`Bags (Max: ${cycle.bags_remaining_to_load ?? 0})`}
                                                value={bagsToLoadInputs[cycle.crop_cycle_id] || ''}
                                                onChange={(e) => handleBagsInputChange(cycle.crop_cycle_id, e.target.value)}
                                                // Disable if already added or no bags remaining
                                                disabled={selectedItems.some(item => item.crop_cycle_id === cycle.crop_cycle_id) || (cycle.bags_remaining_to_load ?? 0) <= 0}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(cycle)}
                                            className="h-[56px] px-4 btn-primary rounded-xl flex items-center justify-center gap-1.5 text-sm shrink-0 disabled:bg-on-surface/20 disabled:text-on-surface/40"
                                             // Disable if already added, no bags remaining, or input is invalid/empty
                                            disabled={
                                                selectedItems.some(item => item.crop_cycle_id === cycle.crop_cycle_id) ||
                                                (cycle.bags_remaining_to_load ?? 0) <= 0 ||
                                                !bagsToLoadInputs[cycle.crop_cycle_id] ||
                                                parseInt(bagsToLoadInputs[cycle.crop_cycle_id], 10) <= 0
                                            }
                                        >
                                            <Plus size={16} /> Add
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-on-surface-variant py-4">No cycles ready for loading at this location.</p>
                        )}
                    </div>

                    {/* Selected Items Summary */}
                     {selectedItems.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-on-surface">Items to Load ({totalBagsLoaded} / {bagCapacity} Bags)</h3>
                            <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-2 -mr-2">
                                {selectedItems.map(item => (
                                    <div key={item.crop_cycle_id} className="flex items-center justify-between bg-secondary-container/40 p-3 rounded-lg text-sm">
                                        <div>
                                            <p className="font-medium text-on-secondary-container">{item.farmer_name} ({item.lot_no || 'No Lot#'})</p>
                                            <p className="text-xs text-on-secondary-container/80">Bags: {item.bags_loaded}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.crop_cycle_id)}
                                            className="p-1.5 rounded-full text-error hover:bg-error/10"
                                            aria-label={`Remove ${item.farmer_name}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2 Error Message */}
                    {step2Error && ( <p className="text-sm text-error text-center font-medium">{step2Error}</p> )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handlePrevStep}
                            className="flex-1 h-[50px] text-base font-medium rounded-full border border-outline text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                        >
                           <ArrowLeft className="w-5 h-5" /> Back
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDispatch}
                            disabled={selectedItems.length === 0 || totalBagsLoaded > bagCapacity} // Disable if no items or over capacity
                            className="flex-1 h-[50px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg transition-all disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            Confirm Dispatch
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Animation Styles (same as before) ---
const styles = ` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } `;
if (typeof window !== 'undefined') { const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = styles; document.head.appendChild(styleSheet); }