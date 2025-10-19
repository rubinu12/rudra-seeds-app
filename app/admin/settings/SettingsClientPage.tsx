// app/admin/settings/SettingsClientPage.tsx
"use client";

import React, { useState, useTransition, useActionState, useRef, useEffect } from 'react';
import * as actions from './actions';
import type { FormState } from './actions'; // Import the FormState type
import { MasterDataItem, SeedVarietySetting, ShipmentCompanySetting } from './data';
import { Leaf, Milestone, Save, ToggleLeft, ToggleRight, Tractor, Building, Globe, PlusCircle, Trash2, Pencil } from 'lucide-react';

type SettingsClientPageProps = {
    initialMode: 'Growing' | 'Harvesting';
    landmarks: MasterDataItem[];
    villages: MasterDataItem[];
    destCompanies: MasterDataItem[];
    seedVarieties: SeedVarietySetting[];
    shipmentCompanies: ShipmentCompanySetting[];
};

const initialState: FormState = { message: '', success: false, error: '' };

export function SettingsClientPage({
    initialMode,
    landmarks,
    villages,
    destCompanies,
    seedVarieties,
    shipmentCompanies,
}: SettingsClientPageProps) {
    const [currentMode, setCurrentMode] = useState(initialMode);
    const [isPending, startTransition] = useTransition();

    const handleModeChange = (mode: 'Growing' | 'Harvesting') => {
        startTransition(async () => {
            const result = await actions.updateEmployeeMode(mode);
            if (result.success) {
                setCurrentMode(mode);
                alert(result.message);
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* --- App Mode Control Section --- */}
            <div className="bg-surface-container rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-medium text-on-surface mb-1">Employee App Mode</h2>
                <p className="text-sm text-on-surface-variant mb-4">Switch the entire employee application between the growing season and harvesting season.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => handleModeChange('Growing')}
                        disabled={isPending || currentMode === 'Growing'}
                        className={`flex-1 p-4 rounded-xl text-left transition-all ${currentMode === 'Growing' ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-variant text-on-surface-variant hover:bg-primary/10'}`}
                    >
                        <h3 className="font-bold">Growing Season</h3>
                        <p className="text-sm">Employees will see field visit lists and data entry forms.</p>
                    </button>
                    <button
                        onClick={() => handleModeChange('Harvesting')}
                        disabled={isPending || currentMode === 'Harvesting'}
                        className={`flex-1 p-4 rounded-xl text-left transition-all ${currentMode === 'Harvesting' ? 'bg-secondary text-on-primary shadow-lg' : 'bg-surface-variant text-on-surface-variant hover:bg-secondary/10'}`}
                    >
                        <h3 className="font-bold">Harvesting Season</h3>
                        <p className="text-sm">Employees will see harvesting, sampling, and shipment tools.</p>
                    </button>
                </div>
            </div>

            {/* --- Master Data Sections --- */}
            <MasterDataSection title="Villages" items={villages} addAction={actions.addVillage} toggleAction={actions.toggleVillage} Icon={Globe} />
            <MasterDataSection title="Landmarks" items={landmarks} addAction={actions.addLandmark} toggleAction={actions.toggleLandmark} Icon={Milestone} />
            <MasterDataSection title="Destination Companies" items={destCompanies} addAction={actions.addDestinationCompany} toggleAction={actions.toggleDestinationCompany} Icon={Building} />

            {/* Specialized Section for Seed Varieties */}
            <div className="bg-surface-container rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Leaf className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-medium text-on-surface">Seed Varieties</h2>
                </div>
                <SeedVarietyForm />
                <div className="mt-4 space-y-2">
                    {seedVarieties.map(item => <SeedVarietyItem key={item.id} item={item} />)}
                </div>
            </div>
            
            {/* Specialized Section for Shipment Companies */}
            <div className="bg-surface-container rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Tractor className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-medium text-on-surface">Shipment Companies</h2>
                </div>
                <ShipmentCompanyForm />
                <div className="mt-4 space-y-2">
                    {shipmentCompanies.map(item => <ShipmentCompanyItem key={item.id} item={item} />)}
                </div>
            </div>
        </div>
    );
}


// --- Reusable Component for Simple Master Data ---
function MasterDataSection({ title, items, addAction, toggleAction, Icon }: { title: string, items: MasterDataItem[], addAction: any, toggleAction: (id: number) => Promise<FormState>, Icon: React.ElementType }) {
    const [state, formAction] = useActionState(addAction, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <div className="bg-surface-container rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <Icon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-medium text-on-surface">{title}</h2>
            </div>
            <form action={formAction} ref={formRef} className="flex gap-4">
                <input type="text" name={`${title.toLowerCase().replace(' ', '_')}_name`} placeholder={`Add new ${title.slice(0, -1)}...`} className="flex-grow form-input" required />
                <button type="submit" className="btn-primary-small"><PlusCircle className="w-5 h-5 mr-2" /> Add</button>
            </form>
            {state?.error && <p className="text-sm text-error mt-2">{state.error}</p>}
            <div className="mt-4 space-y-2">
                {items.map(item => <DataItem key={item.id} item={item} onToggle={() => toggleAction(item.id)} />)}
            </div>
        </div>
    );
}

const DataItem = ({ item, onToggle }: { item: MasterDataItem, onToggle: () => void }) => {
    const [isPending, startTransition] = useTransition();
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg ${item.is_active ? 'bg-surface' : 'bg-surface-variant/30'}`}>
            <p className={`${item.is_active ? 'text-on-surface' : 'text-on-surface-variant line-through'}`}>{item.name}</p>
            <button onClick={() => startTransition(() => { onToggle(); })} disabled={isPending} className="p-1">
                {item.is_active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-on-surface-variant" />}
            </button>
        </div>
    );
};

// --- Specialized Components for Complex Forms ---

const SeedVarietyForm = () => {
    const [state, formAction] = useActionState(actions.addSeedVariety, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    useEffect(() => { if (state.success) formRef.current?.reset(); }, [state]);
    return (
        <form ref={formRef} action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="variety_name" placeholder="Variety Name" className="form-input" required />
                <input name="crop_type" placeholder="Crop Type (e.g., Wheat)" className="form-input" required />
                <input name="company_name" placeholder="Brand/Company Name" className="form-input" required />
            </div>
            {state?.error && <p className="text-sm text-error mt-2">{state.error}</p>}
            <div className="flex justify-end items-center gap-4">
                 <label className="flex items-center gap-2 text-sm text-on-surface-variant"><input type="checkbox" name="is_default" className="form-checkbox" /> Set as default</label>
                <button type="submit" className="btn-primary-small"><PlusCircle className="w-5 h-5 mr-2" /> Add Variety</button>
            </div>
        </form>
    );
};

const SeedVarietyItem = ({ item }: { item: SeedVarietySetting }) => {
    const [isPending, startTransition] = useTransition();
    return (
        <div className={`p-3 rounded-lg ${item.is_active ? 'bg-surface' : 'bg-surface-variant/30'}`}>
            <div className="flex items-center justify-between">
                <p className={`${item.is_active ? 'font-medium text-on-surface' : 'text-on-surface-variant line-through'}`}>{item.name}</p>
                <button onClick={() => startTransition(() => { actions.toggleSeedVariety(item.id); })} disabled={isPending} className="p-1">
                    {item.is_active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-on-surface-variant" />}
                </button>
            </div>
            <p className={`text-sm ${item.is_active ? 'text-on-surface-variant' : 'text-on-surface-variant/70 line-through'}`}>{item.crop_type} • {item.company_name}</p>
        </div>
    );
};

const ShipmentCompanyForm = () => {
    const [state, formAction] = useActionState(actions.addShipmentCompany, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    useEffect(() => { if (state.success) formRef.current?.reset(); }, [state]);
    return (
        <form ref={formRef} action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="company_name" placeholder="Company Name" className="form-input md:col-span-3" required />
                <input name="owner_name" placeholder="Owner Name (Optional)" className="form-input" />
                <input name="owner_mobile" placeholder="Owner Mobile (Optional)" className="form-input" />
            </div>
             {state?.error && <p className="text-sm text-error mt-2">{state.error}</p>}
            <div className="flex justify-end"><button type="submit" className="btn-primary-small"><PlusCircle className="w-5 h-5 mr-2" /> Add Company</button></div>
        </form>
    );
};

const ShipmentCompanyItem = ({ item }: { item: ShipmentCompanySetting }) => {
    const [isPending, startTransition] = useTransition();
    return (
        <div className={`p-3 rounded-lg ${item.is_active ? 'bg-surface' : 'bg-surface-variant/30'}`}>
            <div className="flex items-center justify-between">
                <p className={`${item.is_active ? 'font-medium text-on-surface' : 'text-on-surface-variant line-through'}`}>{item.name}</p>
                <button onClick={() => startTransition(() => { actions.toggleShipmentCompany(item.id); })} disabled={isPending} className="p-1">
                    {item.is_active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-on-surface-variant" />}
                </button>
            </div>
            <p className={`text-sm ${item.is_active ? 'text-on-surface-variant' : 'text-on-surface-variant/70 line-through'}`}>{item.owner_name} • {item.owner_mobile}</p>
        </div>
    );
};