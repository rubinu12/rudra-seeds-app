// components/employee/loading/NewShipmentModal.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useActionState } from 'react';
import Modal from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/FormInputs'; // Reusing existing FormInputs
import SearchableSelect from '@/components/ui/SearchableSelect';
import { startNewShipment, LoadingFormState } from '@/app/employee/loading/actions';
import { MasterDataItem, ShipmentCompanySetting } from '@/app/admin/settings/data';
import { Truck, Save, LoaderCircle, Package, X } from 'lucide-react';

type NewShipmentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    transportCompanies: ShipmentCompanySetting[]; // Pass active companies
    destinationCompanies: MasterDataItem[]; // Pass active companies
    onShipmentStarted: (shipmentId: number) => void; // Callback after successful creation
};

// Initial state for the startNewShipment action
const initialState: LoadingFormState = { message: '', success: false, errors: {} };

// Define the shape of the form data state
type FormDataState = {
    transportCompanyId: string;
    vehicleNo: string;
    capacityTonnes: string;
    driverName: string;
    driverMobile: string;
    destinationCompanyId: string;
};

export function NewShipmentModal({
    isOpen,
    onClose,
    transportCompanies,
    destinationCompanies,
    onShipmentStarted
}: NewShipmentModalProps) {
    const [state, formAction] = useActionState(startNewShipment, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const [formData, setFormData] = useState<FormDataState>({
        transportCompanyId: '',
        vehicleNo: '',
        capacityTonnes: '',
        driverName: '',
        driverMobile: '',
        destinationCompanyId: '',
    });

    const TONNES_TO_BAGS_MULTIPLIER = 20;
    const bagCapacity = React.useMemo(() => {
        const tonnes = parseFloat(formData.capacityTonnes);
        return (!isNaN(tonnes) && tonnes > 0) ? Math.floor(tonnes * TONNES_TO_BAGS_MULTIPLIER) : 0;
    }, [formData.capacityTonnes]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: keyof FormDataState) => (value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (state.success && state.shipmentId) {
            onShipmentStarted(state.shipmentId); // Notify parent
            handleClose(); // Close modal on success
        }
        // Keep modal open on error to show message
    }, [state.success, state.shipmentId]); // Removed onClose, onShipmentStarted from dependencies

    const handleClose = () => {
        formRef.current?.reset();
        setFormData({ // Reset local form state
             transportCompanyId: '', vehicleNo: '', capacityTonnes: '',
             driverName: '', driverMobile: '', destinationCompanyId: '',
        });
        // Reset action state? useActionState doesn't have a built-in reset,
        // but maybe we don't need to explicitly reset it if the component unmounts/remounts.
        // For now, rely on unmount/remount or manually reset if issues arise.
        onClose(); // Call parent's close handler
    };


    // Prepare options for selects
    const transportOptions = transportCompanies.map(c => ({ value: String(c.id), label: c.name }));
    const destinationOptions = destinationCompanies.map(c => ({ value: String(c.id), label: c.name }));

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Start New Shipment" maxWidth="max-w-lg">
            <form ref={formRef} action={formAction} className="space-y-5">
                {/* Input fields adapted from NewShipmentForm.tsx */}
                <SearchableSelect
                    id="transportCompanyId"
                    name="transportCompanyId"
                    label="Transport Company"
                    options={transportOptions}
                    value={formData.transportCompanyId}
                    onChange={handleSelectChange('transportCompanyId')}
                />
                {state.errors?.transportCompanyId && <p className="text-sm text-error -mt-3 px-1">{state.errors.transportCompanyId[0]}</p>}

                <Input
                    id="vehicleNo"
                    name="vehicleNo"
                    label="Vehicle No."
                    value={formData.vehicleNo}
                    onChange={handleInputChange}
                    required
                    className="uppercase" // Keep uppercase styling
                    autoCapitalize="characters"
                />
                 {state.errors?.vehicleNo && <p className="text-sm text-error -mt-3 px-1">{state.errors.vehicleNo[0]}</p>}

                 <Input
                    id="driverName"
                    name="driverName"
                    label="Driver Name"
                    value={formData.driverName}
                    onChange={handleInputChange}
                    required
                 />
                 {state.errors?.driverName && <p className="text-sm text-error -mt-3 px-1">{state.errors.driverName[0]}</p>}


                <div className="grid grid-cols-2 gap-4 items-end">
                    <Input
                        id="capacityTonnes"
                        name="capacityTonnes"
                        label="Capacity (Tonnes)"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.capacityTonnes}
                        onChange={handleInputChange}
                        required
                    />
                    <div className="bg-secondary-container/30 text-on-secondary-container text-sm font-medium h-[56px] flex items-center justify-center rounded-xl px-3 text-center mb-[2px]">
                        <Package size={16} className="mr-1.5 opacity-80" /> ~ {bagCapacity} Bags
                    </div>
                </div>
                 {state.errors?.capacityTonnes && <p className="text-sm text-error -mt-3 px-1 col-span-2">{state.errors.capacityTonnes[0]}</p>}


                <Input
                    id="driverMobile"
                    name="driverMobile"
                    label="Driver Mobile (Optional)"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*" // Basic pattern, consider stricter if needed
                    maxLength={10}
                    value={formData.driverMobile}
                    onChange={handleInputChange}
                />
                 {state.errors?.driverMobile && <p className="text-sm text-error -mt-3 px-1">{state.errors.driverMobile[0]}</p>}

                <SearchableSelect
                    id="destinationCompanyId"
                    name="destinationCompanyId"
                    label="Destination Company"
                    options={destinationOptions}
                    value={formData.destinationCompanyId}
                    onChange={handleSelectChange('destinationCompanyId')}
                />
                 {state.errors?.destinationCompanyId && <p className="text-sm text-error -mt-3 px-1">{state.errors.destinationCompanyId[0]}</p>}


                {/* General Form Error */}
                {state.errors?._form && (
                    <p className="text-sm text-error text-center mt-4 bg-error-container p-3 rounded-lg">{state.errors._form[0]}</p>
                )}
                 {/* Success Message (optional, as modal closes) */}
                 {state.success && (
                     <p className="text-sm text-green-600 text-center mt-4">{state.message}</p>
                 )}

                {/* Submit Button */}
                <div className="pt-4">
                     <SubmitButton />
                </div>
            </form>
        </Modal>
    );
}

// Separate SubmitButton component to use useFormStatus hook
function SubmitButton() {
    // const { pending } = useFormStatus(); // Requires React ^18.3 or experimental
    const pending = false; // Placeholder until useFormStatus is stable or alternative used

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full h-[50px] text-base font-medium rounded-full bg-primary text-on-primary shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-on-surface/20 disabled:text-on-surface/40 disabled:shadow-none disabled:cursor-not-allowed"
        >
            {pending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {pending ? 'Starting...' : 'Start Shipment'}
        </button>
    );
}