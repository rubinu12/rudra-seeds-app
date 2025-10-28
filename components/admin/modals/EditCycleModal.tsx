// components/admin/modals/EditCycleModal.tsx
"use client";

import React, { useState, useEffect, useTransition, useActionState } from 'react';
import Modal from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/FormInputs'; // Use custom FormInputs
// Added Pencil icon
import { Search, LoaderCircle, X, Save, User, MapPin, CalendarDays, RotateCcw, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { CropCycleForEmployee } from '@/lib/definitions';
import { fetchCycleDetailsAction } from '@/app/admin/cycles/edit/actions';
import type { CycleDetailsForEditing } from '@/lib/admin-data';
// Assuming update action exists in the specified file
import { updateCycleAction, UpdateCycleFormState } from '@/app/admin/cycles/edit/actions';

type EditCycleModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Define different views within the modal
type ModalView = 'cycle' | 'editFarmer' | 'editFarm';

const initialUpdateState: UpdateCycleFormState = { message: '', success: false, errors: {} };

export default function EditCycleModal({ isOpen, onClose }: EditCycleModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CropCycleForEmployee[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [cycleDetails, setCycleDetails] = useState<CycleDetailsForEditing | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isFetchPending, startFetchTransition] = useTransition();
  const [currentView, setCurrentView] = useState<ModalView>('cycle'); // State to manage view

  // State for cycle-specific editable fields
  const [editData, setEditData] = useState({
    sowing_date: '',
    seed_bags_purchased: '',
    goods_collection_method: '',
    seed_bags_returned: '',
    amount_paid_back: '0',
  });

  // State for farmer/farm edit forms (placeholders for now)
  const [editFarmerData, setEditFarmerData] = useState({});
  const [editFarmData, setEditFarmData] = useState({});


  const [updateState, formAction] = useActionState(updateCycleAction, initialUpdateState);
  const [isUpdatePending, startUpdateTransition] = useTransition();


  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // Effect for searching cycles (Unchanged)
  useEffect(() => {
     if (debouncedSearchTerm) {
      setIsLoadingSearch(true);
      setSearchResults([]);
      setSelectedCycleId(null);
      setCycleDetails(null);
      setCurrentView('cycle'); // Reset view on new search
      fetch(`/api/cycles/search?query=${debouncedSearchTerm}`)
        .then(res => res.json())
        .then((data: CropCycleForEmployee[]) => { setSearchResults(data); })
        .catch(err => { console.error("Failed to fetch search results:", err); })
        .finally(() => setIsLoadingSearch(false));
    } else {
      setSearchResults([]);
      setIsLoadingSearch(false);
    }
  }, [debouncedSearchTerm]);

  // Effect for fetching details AND setting editData state
  useEffect(() => {
    if (selectedCycleId) {
      setErrorDetails(null);
      setCycleDetails(null);
      setIsLoadingDetails(true);
      setCurrentView('cycle'); // Ensure view resets to cycle details
      startFetchTransition(async () => {
          const result = await fetchCycleDetailsAction(selectedCycleId);
          if (result.success && result.data) {
              setCycleDetails(result.data);
              // Initialize cycle-specific edit state
              setEditData({
                  sowing_date: result.data.sowing_date || '',
                  seed_bags_purchased: String(result.data.seed_bags_purchased ?? ''),
                  goods_collection_method: result.data.goods_collection_method || 'Farm',
                  seed_bags_returned: String(result.data.seed_bags_returned ?? ''),
                  amount_paid_back: '0',
              });
              // Initialize farmer/farm edit states (if needed later)
              // setEditFarmerData({ name: result.data.farmer_name, ... });
              // setEditFarmData({ location: result.data.location_name, ... });
              setErrorDetails(null);
          } else {
              setErrorDetails(result.error || "Failed to fetch details.");
              setCycleDetails(null);
          }
          setIsLoadingDetails(false);
      });
    } else {
        setCycleDetails(null);
        setIsLoadingDetails(false);
        setErrorDetails(null);
        setEditData({ sowing_date: '', seed_bags_purchased: '', goods_collection_method: '', seed_bags_returned: '', amount_paid_back: '0' });
        setCurrentView('cycle'); // Reset view
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycleId]);

   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
       const { name, value } = e.target;
       setEditData(prev => ({ ...prev, [name]: value }));
   };

  const handleCloseModal = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedCycleId(null);
    setCycleDetails(null);
    setErrorDetails(null);
    setEditData({ sowing_date: '', seed_bags_purchased: '', goods_collection_method: '', seed_bags_returned: '', amount_paid_back: '0' });
    setCurrentView('cycle'); // Reset view on close
    onClose();
  };

  const handleSelectCycle = (cycle: CropCycleForEmployee) => {
      setSearchTerm(cycle.farmer_name);
      setSearchResults([]);
      setSelectedCycleId(cycle.crop_cycle_id);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!cycleDetails) return;
      const formData = new FormData(event.currentTarget);
      formData.append('crop_cycle_id', String(cycleDetails.crop_cycle_id));
      formData.append('crop_cycle_year', String(cycleDetails.crop_cycle_year));
      formData.append('original_amount_paid', String(cycleDetails.amount_paid || 0));
      startUpdateTransition(() => { formAction(formData); });
  };

  useEffect(() => {
    if (updateState.success) {
      console.log("Update successful, closing modal.");
      handleCloseModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateState.success]);


  // Determine modal title based on view
  const modalTitle = currentView === 'editFarmer' ? `Edit Farmer: ${cycleDetails?.farmer_name || ''}`
                   : currentView === 'editFarm' ? `Edit Farm: ${cycleDetails?.location_name || ''}`
                   : "Search and Edit Cycle";


  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title={modalTitle} maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Search Input & Results (Only show if not editing farmer/farm) */}
        {currentView === 'cycle' && (
          <>
            <div className="relative">
                <Input
                    id="cycle-search" name="cycle-search" label="Search Farmer by Name or Mobile..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setSelectedCycleId(null); setCycleDetails(null); }}
                    disabled={isLoadingDetails || isFetchPending}
                />
                 <div className="absolute top-0 right-4 h-full flex items-center">
                     {isLoadingSearch || isFetchPending ? (<LoaderCircle className="w-5 h-5 animate-spin text-primary" />)
                     : searchTerm ? (<button onClick={() => { setSearchTerm(''); setSelectedCycleId(null); }} className="p-1 text-on-surface-variant hover:text-error"><X className="w-5 h-5" /></button>)
                     : (<Search className="w-5 h-5 text-on-surface-variant" />)}
                </div>
            </div>
             {!selectedCycleId && searchResults.length > 0 && (
                 <div className="border border-outline/30 rounded-lg max-h-48 overflow-y-auto bg-surface mt-1 shadow">
                     {searchResults.map((cycle) => (
                        <button key={cycle.crop_cycle_id} onClick={() => handleSelectCycle(cycle)} className="block w-full text-left px-4 py-2 hover:bg-primary/10 border-b border-outline/20 last:border-b-0" >
                            <p className="font-medium text-on-surface">{cycle.farmer_name} ({cycle.mobile_number || 'No Mobile'})</p>
                            <p className="text-xs text-on-surface-variant">{cycle.seed_variety} - {cycle.village}</p>
                        </button>
                     ))}
                 </div>
             )}
             {!selectedCycleId && !isLoadingSearch && searchTerm && searchResults.length === 0 && (
                 <p className="text-sm text-center text-on-surface-variant py-2">No matching cycles found.</p>
             )}
          </>
        )}


        {/* Cycle Details & Edit Form Area (Only show if cycle selected) */}
        {selectedCycleId && (
          <div className={`pt-4 ${currentView === 'cycle' ? 'border-t border-outline/20 mt-4' : ''}`}> {/* Conditional border/margin */}
            {(isLoadingDetails || isFetchPending) && (
              <div className="flex justify-center items-center py-10">
                 <LoaderCircle className="w-8 h-8 text-primary animate-spin" />
                 <p className="ml-3 text-on-surface-variant">Loading details...</p>
              </div>
            )}
            {errorDetails && !isFetchPending && (
              <p className="text-center text-error bg-error-container p-3 rounded-lg">{errorDetails}</p>
            )}

            {/* --- Render based on currentView --- */}
            {cycleDetails && !(isLoadingDetails || isFetchPending) && !errorDetails && (
              <>
                {/* --- CYCLE EDIT VIEW --- */}
                {currentView === 'cycle' && (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <h3 className="text-lg font-medium text-primary mb-2">Editing Cycle #{cycleDetails.crop_cycle_id}</h3>
                    {/* --- Farmer Info Section with Edit Button --- */}
                    <Section title="Farmer Info" icon={User} editAction={() => setCurrentView('editFarmer')}>
                        <InfoItem label="Name" value={cycleDetails.farmer_name} />
                        <InfoItem label="Mobile" value={cycleDetails.mobile_number || 'N/A'} />
                        <InfoItem label="Aadhar" value={cycleDetails.aadhar_number || 'N/A'} />
                        <InfoItem label="Address" value={cycleDetails.home_address || 'N/A'} wide />
                    </Section>
                    {/* --- Farm Info Section with Edit Button --- */}
                     <Section title="Farm & Seed" icon={MapPin} editAction={() => setCurrentView('editFarm')}>
                        <InfoItem label="Location" value={cycleDetails.location_name} wide/>
                        <InfoItem label="Village" value={cycleDetails.village_name} />
                        <InfoItem label="Landmark" value={cycleDetails.landmark_name} />
                        <InfoItem label="Area (Vigha)" value={String(cycleDetails.area_in_vigha ?? 'N/A')} />
                        <InfoItem label="Seed Variety" value={cycleDetails.variety_name} />
                    </Section>
                     {/* --- Editable Sowing Section --- */}
                     <Section title="Sowing Details" icon={CalendarDays}>
                         <Input type="date" id="sowing_date" name="sowing_date" label="Sowing Date" value={editData.sowing_date} onChange={handleEditChange} required disabled={isUpdatePending}/>
                         <Input type="number" id="seed_bags_purchased" name="seed_bags_purchased" label="Seed Bags Purchased" value={editData.seed_bags_purchased} onChange={handleEditChange} required disabled={isUpdatePending} min="0"/>
                         <Select id="goods_collection_method" name="goods_collection_method" label="Collection Method" value={editData.goods_collection_method} onChange={handleEditChange} required disabled={isUpdatePending}>
                            <option value="Farm">Farm</option>
                            <option value="Parabadi yard">Parabadi yard</option>
                            <option value="Dhoraji yard">Dhoraji yard</option>
                            <option value="Jalansar yard">Jalansar yard</option>
                         </Select>
                     </Section>
                     {/* --- Seed Return Section --- */}
                     <Section title="Seed Return & Payment Adjustment" icon={RotateCcw}>
                         <Input type="number" id="seed_bags_returned" name="seed_bags_returned" label="Seed Bags Returned" value={editData.seed_bags_returned} onChange={handleEditChange} disabled={isUpdatePending} min="0" placeholder=" " /* Use space for floating label */ />
                         <Input type="number" id="amount_paid_back" name="amount_paid_back" label="Amount Paid Back to Farmer (₹)" value={editData.amount_paid_back} onChange={handleEditChange} disabled={isUpdatePending} min="0" step="0.01" required/>
                         <InfoItem label="Original Amt Paid" value={`₹${cycleDetails.amount_paid?.toFixed(2) ?? '0.00'}`} />
                         <InfoItem label="Original Status" value={cycleDetails.seed_payment_status || 'N/A'} />
                     </Section>
                    {/* --- Submit Button & Feedback --- */}
                    <div className="pt-4 flex flex-col items-center">
                        <button type="submit" className="btn bg-primary text-on-primary px-8 py-3 rounded-full flex items-center justify-center gap-2 disabled:bg-on-surface/20" disabled={isUpdatePending}>
                            {isUpdatePending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isUpdatePending ? 'Saving...' : 'Save Cycle Changes'}
                        </button>
                        {updateState?.message && ( <p className={`mt-3 text-sm font-medium ${updateState.success ? 'text-green-600' : 'text-error'}`}> {updateState.message} </p> )}
                         {updateState?.errors && Object.entries(updateState.errors).map(([field, errors]) => (
                             errors && errors.length > 0 && ( <p key={field} className="mt-1 text-xs text-error">{field}: {errors.join(', ')}</p> )
                         ))}
                    </div>
                  </form>
                )}

                {/* --- FARMER EDIT VIEW (Placeholder) --- */}
                {currentView === 'editFarmer' && (
                    <div className="bg-surface-container p-6 rounded-lg border border-outline/20">
                        <h3 className="text-lg font-medium text-secondary mb-4">Edit Farmer Details</h3>
                        {/* Add Farmer Form Fields Here, populated from editFarmerData */}
                        <p>(Farmer Edit Form Placeholder)</p>
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setCurrentView('cycle')} className="btn border border-outline text-primary px-6 py-2 rounded-full">Back to Cycle</button>
                            <button className="btn bg-secondary text-on-secondary px-6 py-2 rounded-full">Save Farmer Changes (Disabled)</button>
                        </div>
                    </div>
                )}

                {/* --- FARM EDIT VIEW (Placeholder) --- */}
                 {currentView === 'editFarm' && (
                    <div className="bg-surface-container p-6 rounded-lg border border-outline/20">
                        <h3 className="text-lg font-medium text-tertiary mb-4">Edit Farm Details</h3>
                        {/* Add Farm Form Fields Here, populated from editFarmData */}
                         <p>(Farm Edit Form Placeholder - Need Village/Landmark dropdowns)</p>
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setCurrentView('cycle')} className="btn border border-outline text-primary px-6 py-2 rounded-full">Back to Cycle</button>
                            <button className="btn bg-tertiary text-on-tertiary px-6 py-2 rounded-full">Save Farm Changes (Disabled)</button>
                        </div>
                    </div>
                 )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}


// --- Helper Sub-Components ---
// *** Modified Section to include optional editAction ***
const Section = ({ title, icon: Icon, children, editAction }: {
    title: string,
    icon: React.ElementType,
    children: React.ReactNode,
    editAction?: () => void // Optional function to call when edit button is clicked
}) => (
    <div className="bg-surface p-4 rounded-lg border border-outline/20 relative"> {/* Added relative */}
        <div className="flex items-center justify-between gap-2 mb-3 border-b border-outline/10 pb-2">
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-on-surface">{title}</h4>
            </div>
            {/* Conditionally render Edit button if editAction is provided */}
            {editAction && (
                <button
                    type="button"
                    onClick={editAction}
                    className="btn p-1.5 rounded-full text-primary hover:bg-primary/10"
                    aria-label={`Edit ${title}`}
                >
                    <Pencil className="w-4 h-4" />
                </button>
            )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {children}
        </div>
    </div>
);

const InfoItem = ({ label, value, wide = false }: { label: string, value: string, wide?: boolean }) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-medium text-on-surface break-words">{value}</p>
    </div>
);