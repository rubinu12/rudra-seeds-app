// app/employee/harvesting/LoadingView.tsx
"use client";

import React, { useState, useMemo, useTransition, useActionState, useEffect, useCallback } from 'react';
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';
import { MasterDataItem, ShipmentCompanySetting } from '@/app/admin/settings/data';
import { Input } from '@/components/ui/FormInputs'; // Reusing FormInputs
import { NewShipmentModal } from '@/components/employee/loading/NewShipmentModal';
// ** Import all actions needed **
import { addBagsToShipment, finalizeShipment, undoLastBagAddition, LoadingFormState } from '@/app/employee/loading/actions';
import { Truck, Package, Plus, MapPin, Tag, Phone, ChevronDown, ChevronUp, CheckCircle, AlertCircle, LoaderCircle, Send, LockKeyhole } from 'lucide-react';
import { InProgressShipment } from '@/app/employee/loading/data';

// --- Types & Constants ---

type CollectionMethod = 'All' | 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard';
const collectionMethodLabels: Record<string, string> = { // Use string index for safety
    'All': 'All Locations', 'Farm': 'Farm', 'Parabadi yard': 'Parabadi Yard',
    'Dhoraji yard': 'Dhoraji Yard', 'Jalasar yard': 'Jalasar Yard'
};
const validLocations: string[] = ['Farm', 'Parabadi yard', 'Dhoraji yard', 'Jalasar yard'];

// Props expected from HarvestingDashboard/parent
type LoadingViewProps = {
    initialShipments: InProgressShipment[];
    cyclesReadyForLoading: CropCycleForEmployeeWeighing[];
    transportCompanies: ShipmentCompanySetting[];
    destinationCompanies: MasterDataItem[];
    locationFilter: string; // Receive filter from parent
};

// State types
type AddBagsActionResult = { [cycleId: number]: LoadingFormState | null; };
type AddBagsInputState = { [cycleId: number]: { bags: string; confirmBags: string }; };
const initialActionState: LoadingFormState = { message: '', success: false, errors: {} }; // Generic initial state

// --- Main LoadingView Component ---

export default function LoadingView({
    initialShipments,
    cyclesReadyForLoading,
    transportCompanies,
    destinationCompanies,
    locationFilter
}: LoadingViewProps) {
    const [shipments, setShipments] = useState(initialShipments);
    const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);
    const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
    const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null);
    const [addBagsInputs, setAddBagsInputs] = useState<AddBagsInputState>({});
    const [addBagsPendingState, setAddBagsPendingState] = useState<Record<number, boolean>>({});
    const [addBagsResults, setAddBagsResults] = useState<AddBagsActionResult>({});

    // ** Action states for finalize and undo **
    const [finalizeState, finalizeAction] = useActionState(finalizeShipment, initialActionState);
    const [undoState, undoAction] = useActionState(undoLastBagAddition, initialActionState); // Added undo action state

    // ** Transitions for finalize and undo **
    const [isFinalizePending, startFinalizeTransition] = useTransition();
    const [isUndoPending, startUndoTransition] = useTransition(); // Added undo transition
    const [isAddBagsPending, startAddBagsTransition] = useTransition(); // Separate transition for add bags

     // Effect to update local shipment list and handle selection
     useEffect(() => {
        setShipments(initialShipments);
        if (activeShipmentId && !initialShipments.some(s => s.shipment_id === activeShipmentId)) {
            setActiveShipmentId(null); // Deselect if finalized elsewhere or removed
        } else if (!activeShipmentId && initialShipments.length > 0) {
            // Auto-select the first shipment if none is selected initially
            setActiveShipmentId(initialShipments[0].shipment_id);
        } else if (initialShipments.length === 0) {
             // If there are no shipments, ensure none is selected
            setActiveShipmentId(null);
        }
    }, [initialShipments, activeShipmentId]);

    // Derived active shipment details
    const activeShipment = useMemo(() => {
        return shipments.find(s => s.shipment_id === activeShipmentId);
    }, [activeShipmentId, shipments]);

    // Filter cycles based on HEADER's location filter
    const filteredCycles = useMemo(() => {
        if (locationFilter === 'All') return cyclesReadyForLoading;
        if (validLocations.includes(locationFilter)) {
            return cyclesReadyForLoading.filter(cycle => cycle.goods_collection_method === locationFilter);
        }
        return []; // Return empty if filter is invalid
    }, [cyclesReadyForLoading, locationFilter]);

    // Handler for starting a new shipment
    const handleShipmentStarted = (newShipmentId: number) => {
        console.log("New shipment started:", newShipmentId);
        // Rely on revalidatePath in action and useEffect in parent to update list
    };

    // Handler for bag input changes
    const handleBagsInputChange = (cycleId: number, field: 'bags' | 'confirmBags', value: string) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setAddBagsInputs(prev => ({ ...prev, [cycleId]: { ...(prev[cycleId] || { bags: '', confirmBags: '' }), [field]: sanitizedValue } }));
        setAddBagsResults(prev => ({ ...prev, [cycleId]: null })); // Clear previous result for this item
    };

    // --- Add Bags Action Handling ---
    const handleAddBags = (cycleId: number) => {
        if (!activeShipmentId || !addBagsInputs[cycleId]) return;
        const { bags, confirmBags } = addBagsInputs[cycleId];

        // Validation
        if (bags !== confirmBags || bags === '') {
             setAddBagsResults(prev => ({ ...prev, [cycleId]: { message: "Bag counts do not match or are empty.", success: false } })); return;
        }
        const bagsNum = parseInt(bags, 10);
        if (isNaN(bagsNum) || bagsNum <= 0) {
            setAddBagsResults(prev => ({ ...prev, [cycleId]: { message: "Invalid bag number.", success: false } })); return;
        }
        const cycle = cyclesReadyForLoading.find(c => c.crop_cycle_id === cycleId);
        if (!cycle || bagsNum > (cycle.bags_remaining_to_load ?? 0)) {
             setAddBagsResults(prev => ({ ...prev, [cycleId]: { message: `Cannot load ${bagsNum}. Only ${cycle?.bags_remaining_to_load ?? 0} remaining.`, success: false } })); return;
        }
        if (activeShipment && (activeShipment.total_bags + bagsNum > activeShipment.target_bag_capacity + 20)) {
            const spaceLeft = (activeShipment.target_bag_capacity + 20) - activeShipment.total_bags;
             setAddBagsResults(prev => ({ ...prev, [cycleId]: { message: `Exceeds max vehicle capacity. Space for ${spaceLeft > 0 ? spaceLeft : 0} bags.`, success: false } })); return;
        }

        const formData = new FormData();
        formData.append('shipmentId', String(activeShipmentId));
        formData.append('cropCycleId', String(cycleId));
        formData.append('bagsToLoad', String(bagsNum));

        setAddBagsPendingState(prev => ({ ...prev, [cycleId]: true }));
        setAddBagsResults(prev => ({ ...prev, [cycleId]: null }));

        startAddBagsTransition(async () => {
            const result = await addBagsToShipment(undefined, formData);
            setAddBagsResults(prev => ({ ...prev, [cycleId]: result }));
            if (result.success) {
                setAddBagsInputs(prev => ({ ...prev, [cycleId]: { bags: '', confirmBags: '' } }));
                setExpandedCycleId(null); // Collapse on success
                console.log(`Bags added for cycle ${cycleId}: ${result.message}`);
                // OPTIMISTIC UI UPDATE for shipment total bags
                setShipments(prevShipments => prevShipments.map(ship =>
                    ship.shipment_id === activeShipmentId ? { ...ship, total_bags: ship.total_bags + bagsNum } : ship
                ));
                // NOTE: cyclesReadyForLoading update (remaining bags) relies on server revalidation triggered by the action
            } else {
                 console.error(`Failed adding bags for cycle ${cycleId}: ${result.message}`);
            }
             setAddBagsPendingState(prev => ({ ...prev, [cycleId]: false }));
        });
    };

    // --- Finalize Shipment Action Handling ---
     const handleFinalize = () => {
        if (!activeShipmentId) return;
        const formData = new FormData();
        formData.append('shipmentId', String(activeShipmentId));
        startFinalizeTransition(() => { finalizeAction(formData); });
     };

    // --- Undo Action Handling ---
    const handleUndo = () => {
         if (!activeShipmentId) return;
         if (!confirm("Are you sure you want to undo the last bag addition to this shipment? This cannot be undone.")) return; // Added confirmation
         const formData = new FormData();
         formData.append('shipmentId', String(activeShipmentId));
         startUndoTransition(() => { undoAction(formData); });
    };

     // Effect to handle finalize/undo success/error feedback
     useEffect(() => {
        // Handle finalize result
        if (finalizeState.shipmentId === activeShipmentId) { // Check if the result matches the active shipment
            if (finalizeState.success) {
                console.log("Finalize successful:", finalizeState.message);
                alert(finalizeState.message); // Simple feedback
                setActiveShipmentId(null); // Deselect on success
                // List update relies on revalidatePath
            } else if (finalizeState.message && !isFinalizePending) { // Show error only when not pending
                console.error("Finalize error:", finalizeState.message);
                // Error is displayed via finalizeResult prop in StickyShipmentBar
            }
        }

        // Handle undo result
        if (undoState.shipmentId === activeShipmentId) { // Check if the result matches the active shipment
            if (undoState.success) {
                console.log("Undo successful:", undoState.message);
                // Optimistic update for shipment total
                const match = undoState.message.match(/(\d+)\s+bags/);
                const bagsUndone = match ? parseInt(match[1], 10) : 0;
                if (bagsUndone > 0) {
                    setShipments(prevShipments => prevShipments.map(ship =>
                        ship.shipment_id === undoState.shipmentId
                            ? { ...ship, total_bags: Math.max(0, ship.total_bags - bagsUndone) }
                            : ship
                    ));
                } else {
                    console.warn("Could not parse bags undone from message:", undoState.message);
                    // Consider triggering a full refresh if parsing fails
                }
                alert(undoState.message); // Simple feedback
                // Cycle list update relies on revalidatePath
            } else if (undoState.message && !isUndoPending) { // Show error only when not pending
                console.error("Undo error:", undoState.message);
                // Error is displayed via undoResult prop in StickyShipmentBar (can be added)
                 alert(`Undo failed: ${undoState.message}`); // Simple alert for now
            }
        }
     }, [finalizeState, undoState, isFinalizePending, isUndoPending, activeShipmentId]); // Add activeShipmentId


    // --- Finalize Button Enabled Logic ---
    const canFinalize = useMemo(() => {
        if (!activeShipment) return false;
        const total = activeShipment.total_bags;
        const target = activeShipment.target_bag_capacity;
        if (total <= 0) return false;
        const lowerBound = target - 20;
        const upperBound = target + 20;
        return total >= lowerBound && total <= upperBound;
    }, [activeShipment]);

    // Toggle expanded cycle
    const toggleExpandCycle = (cycleId: number) => {
        const nextExpandedId = expandedCycleId === cycleId ? null : cycleId;
        setExpandedCycleId(nextExpandedId);
        // Clear inputs when collapsing or expanding a different item
        if (expandedCycleId !== cycleId || nextExpandedId === null) {
            setAddBagsInputs(prev => ({ ...prev, [cycleId]: { bags: '', confirmBags: '' } }));
            setAddBagsResults(prev => ({ ...prev, [cycleId]: null }));
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. Sticky Shipment Bar */}
            <StickyShipmentBar
                shipments={shipments}
                activeShipmentId={activeShipmentId}
                onSelectShipment={setActiveShipmentId}
                onNewShipmentClick={() => setIsNewShipmentModalOpen(true)}
                onFinalizeClick={handleFinalize}
                canFinalize={canFinalize}
                isFinalizePending={isFinalizePending}
                finalizeResult={finalizeState} // Pass action state
                onUndoClick={handleUndo}
                isUndoPending={isUndoPending}
                undoResult={undoState} // Pass undo action state
            />

            {/* 2. List of Cycles Ready for Loading */}
             <h2 className="text-sm font-medium text-on-surface-variant px-2 pt-2">
                 Cycles at {collectionMethodLabels[locationFilter] || locationFilter} ({filteredCycles.length})
             </h2>
             {filteredCycles.length > 0 ? (
                 <div className="space-y-3">
                     {filteredCycles.map((cycle) => (
                         <LoadingCycleListItem
                            key={cycle.crop_cycle_id}
                            cycle={cycle}
                            isExpanded={expandedCycleId === cycle.crop_cycle_id}
                            onToggleExpand={() => toggleExpandCycle(cycle.crop_cycle_id)}
                            inputValues={addBagsInputs[cycle.crop_cycle_id] || { bags: '', confirmBags: '' }}
                            onInputChange={handleBagsInputChange}
                            onAddBags={handleAddBags}
                            isAddPending={addBagsPendingState[cycle.crop_cycle_id] || false}
                            addResult={addBagsResults[cycle.crop_cycle_id]}
                            isDisabled={!activeShipmentId} // Disable adding if no shipment selected
                         />
                     ))}
                 </div>
             ) : (
                 <p className="text-center text-on-surface-variant py-6 text-sm">
                     No cycles with status 'Weighed' found at this location.
                 </p>
             )}

            {/* 3. New Shipment Modal */}
            <NewShipmentModal
                isOpen={isNewShipmentModalOpen}
                onClose={() => setIsNewShipmentModalOpen(false)}
                transportCompanies={transportCompanies}
                destinationCompanies={destinationCompanies}
                onShipmentStarted={handleShipmentStarted}
            />
        </div>
    );
}

// --- Sub-Components ---

// Sticky Bar Component - Added Undo button and result props
function StickyShipmentBar({
    shipments,
    activeShipmentId,
    onSelectShipment,
    onNewShipmentClick,
    onFinalizeClick,
    canFinalize,
    isFinalizePending,
    finalizeResult,
    onUndoClick,
    isUndoPending,
    undoResult // Added undoResult prop
}: {
    shipments: InProgressShipment[];
    activeShipmentId: number | null;
    onSelectShipment: (id: number | null) => void;
    onNewShipmentClick: () => void;
    onFinalizeClick: () => void;
    canFinalize: boolean;
    isFinalizePending: boolean;
    finalizeResult: LoadingFormState | null;
    onUndoClick: () => void;
    isUndoPending: boolean;
    undoResult: LoadingFormState | null; // Added prop type
}) {
    const activeShipment = shipments.find(s => s.shipment_id === activeShipmentId);
    const remainingBags = activeShipment ? activeShipment.target_bag_capacity - activeShipment.total_bags : null;
    const selectOptions = shipments.map(s => {
        const remaining = s.target_bag_capacity - s.total_bags;
        return { value: s.shipment_id, label: `${s.vehicle_number} (${s.total_bags}/${s.target_bag_capacity}) - ${remaining >= 0 ? remaining : 0} left` };
    });
    // Can only undo if a shipment is active and has bags loaded
    const canUndo = activeShipment && activeShipment.total_bags > 0;

    return (
        // Added relative positioning for error message placement
        <div className="relative sticky top-16 z-10 bg-surface/90 backdrop-blur-md p-3 rounded-xl border border-outline/30 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-grow w-full sm:w-auto">
                 <select value={activeShipmentId ?? ''} onChange={(e) => onSelectShipment(e.target.value ? Number(e.target.value) : null)} className="w-full h-12 pl-4 pr-10 text-sm font-medium rounded-full border border-outline bg-surface-container text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70 disabled:bg-outline/10" disabled={shipments.length === 0}>
                    <option value="" disabled={!!activeShipmentId}>-- Select Active Shipment --</option>
                    {selectOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                 {activeShipment && remainingBags !== null && ( <div className="absolute -top-2 -right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-on-primary shadow"> {remainingBags >= 0 ? `${remainingBags} Left` : `${Math.abs(remainingBags)} Over`} </div> )}
            </div>
             <div className="flex w-full sm:w-auto gap-2">
                <button onClick={onNewShipmentClick} className="flex-shrink-0 h-12 w-12 sm:w-auto sm:px-4 bg-primary text-on-primary rounded-full flex items-center justify-center gap-1 text-sm font-medium hover:shadow-md transition-shadow" aria-label="Start New Shipment"> <Plus size={20} /> <span className="hidden sm:inline">New</span> </button>
                {/* --- UNDO BUTTON --- */}
                 <button onClick={onUndoClick} disabled={!canUndo || isUndoPending || isFinalizePending} className="flex-shrink-0 h-12 w-12 bg-error-container text-on-error-container rounded-full flex items-center justify-center text-sm font-medium hover:shadow-md transition-shadow disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none" aria-label="Undo Last Bag Addition">
                    {isUndoPending ? <LoaderCircle size={18} className="animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>}
                 </button>
                 {/* --- FINALIZE BUTTON --- */}
                 <button onClick={onFinalizeClick} disabled={!activeShipment || !canFinalize || isFinalizePending || finalizeResult?.success} className="flex-1 sm:flex-grow-0 h-12 px-4 bg-secondary text-on-secondary rounded-full flex items-center justify-center gap-1 text-sm font-medium hover:shadow-md transition-shadow disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none" aria-label="Finalize and Dispatch Shipment"> {isFinalizePending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />} {isFinalizePending ? 'Dispatching...' : 'Dispatch'} </button>
            </div>
             {/* Combined Error Display Area below buttons */}
             <div className="w-full sm:absolute sm:top-full sm:left-1/2 sm:-translate-x-1/2 mt-1 sm:mt-0 text-center">
                 {/* Finalize Error */}
                 {finalizeResult && !finalizeResult.success && finalizeResult.message && !isFinalizePending && (
                    <p className="text-xs text-error inline-block bg-error-container px-2 py-0.5 rounded"> Error: {finalizeResult.message} </p>
                 )}
                 {/* Undo Error */}
                 {undoResult && !undoResult.success && undoResult.message && !isUndoPending && (
                    <p className="text-xs text-error inline-block bg-error-container px-2 py-0.5 rounded ml-2"> Undo Error: {undoResult.message} </p>
                 )}
            </div>
        </div>
    );
}


// Expandable List Item Component
function LoadingCycleListItem({
    cycle,
    isExpanded,
    onToggleExpand,
    inputValues,
    onInputChange,
    onAddBags,
    isAddPending,
    addResult,
    isDisabled
}: {
    cycle: CropCycleForEmployeeWeighing;
    isExpanded: boolean;
    onToggleExpand: () => void;
    inputValues: { bags: string; confirmBags: string };
    onInputChange: (cycleId: number, field: 'bags' | 'confirmBags', value: string) => void;
    onAddBags: (cycleId: number) => void;
    isAddPending: boolean;
    addResult: LoadingFormState | null;
    isDisabled: boolean;
}) {
    const bagsRemaining = cycle.bags_remaining_to_load ?? 0;
    const inputsMatch = inputValues.bags !== '' && inputValues.bags === inputValues.confirmBags;
    // Can add if inputs match, bags > 0, not pending, no success yet, add is not generally disabled, bags remain, AND bags <= remaining
    const canAdd = inputsMatch && Number(inputValues.bags) > 0 && !isAddPending && !addResult?.success && !isDisabled && bagsRemaining > 0 && Number(inputValues.bags) <= bagsRemaining;

    let errorMessage = '';
     if (addResult && !addResult.success) {
        errorMessage = addResult.message;
     } else if (inputValues.bags !== '' && Number(inputValues.bags) > bagsRemaining) {
          errorMessage = `Only ${bagsRemaining} bags remaining.`;
     } else if (inputValues.bags !== '' && inputValues.confirmBags !== '' && !inputsMatch) {
         errorMessage = 'Bag counts do not match.';
     }


    return (
        <div className={`bg-surface rounded-2xl border border-outline/30 shadow-sm transition-all duration-300 ease-out overflow-hidden ${isExpanded ? 'shadow-md ring-1 ring-primary/30' : ''}`}>
            {/* Collapsed View */}
            <button onClick={onToggleExpand} className="w-full p-4 flex justify-between items-center text-left hover:bg-surface-container/50" aria-expanded={isExpanded} disabled={bagsRemaining <= 0} >
                <div>
                    <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p>
                    <p className="text-sm text-on-surface-variant">{cycle.seed_variety}</p>
                    <p className={`text-xs font-medium mt-1 ${bagsRemaining > 0 ? 'text-primary' : 'text-on-surface-variant/70'}`}> Bags Remaining: {bagsRemaining} </p>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    {cycle.mobile_number && ( <a href={`tel:${cycle.mobile_number}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors" aria-label={`Call ${cycle.farmer_name}`}> <Phone className="w-4 h-4" /> </a> )}
                     {bagsRemaining > 0 ? ( isExpanded ? <ChevronUp className="w-5 h-5 text-on-surface-variant" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" /> ) : ( <CheckCircle className="w-5 h-5 text-green-600" /> )}
                 </div>
            </button>

            {/* Expanded View */}
            {isExpanded && bagsRemaining > 0 && (
                <div className="px-4 pb-4 pt-2 border-t border-outline/20 space-y-3 animate-fadeIn">
                     <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-on-surface-variant">
                         <span className="flex items-center gap-1"><Tag size={12}/> Lot: <strong className="text-on-surface">{cycle.lot_no || 'N/A'}</strong></span>
                         <span className="flex items-center gap-1"><MapPin size={12}/> Landmark: <strong className="text-on-surface">{cycle.landmark_name || 'N/A'}</strong></span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                        <Input id={`bags_${cycle.crop_cycle_id}`} name={`bags_${cycle.crop_cycle_id}`} type="number" inputMode="numeric" pattern="[0-9]*" label={`Bags (Max ${bagsRemaining})`} value={inputValues.bags} onChange={(e) => onInputChange(cycle.crop_cycle_id, 'bags', e.target.value)} disabled={isAddPending || addResult?.success || isDisabled} required className={`${(errorMessage && errorMessage !== 'Bag counts do not match.') ? 'border-error focus-within:border-error' : ''}`} />
                        <div className="relative">
                            <Input id={`confirmBags_${cycle.crop_cycle_id}`} name={`confirmBags_${cycle.crop_cycle_id}`} type="password" inputMode="numeric" pattern="[0-9]*" label="Confirm Bags" value={inputValues.confirmBags} onChange={(e) => onInputChange(cycle.crop_cycle_id, 'confirmBags', e.target.value)} disabled={isAddPending || addResult?.success || isDisabled} required className={`${errorMessage === 'Bag counts do not match.' ? 'border-error focus-within:border-error' : ''}`} />
                            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-on-surface-variant pointer-events-none"> <LockKeyhole className="w-5 h-5"/> </div>
                         </div>
                    </div>
                     {errorMessage && !addResult?.success && ( <p className="text-sm text-error text-center">{errorMessage}</p> )}
                      {addResult?.success && ( <p className="text-sm text-green-600 text-center flex items-center justify-center gap-1"> <CheckCircle size={16}/> {addResult.message} </p> )}
                    <button type="button" onClick={() => onAddBags(cycle.crop_cycle_id)} disabled={!canAdd} className="w-full h-[48px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg transition-all disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none flex items-center justify-center gap-2" aria-label={`Add bags for ${cycle.farmer_name} to shipment`} >
                         {isAddPending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                         {isAddPending ? 'Adding...' : 'Add Bags to Shipment'}
                    </button>
                    {isDisabled && <p className="text-xs text-center text-amber-700">Please select an active shipment first.</p>}
                </div>
            )}
        </div>
    );
}


// Animation Styles
const styles = ` @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; } `;
if (typeof window !== 'undefined') { const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = styles; document.head.appendChild(styleSheet); }