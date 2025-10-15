"use client";

import { useState, useActionState } from 'react';
import { createFarmVisit } from '../actions';
import { CropCycleForEmployee } from '@/lib/definitions';
import Link from 'next/link';

// --- Hardcoded Options (as requested for better performance) ---
const fertilizerOptions = [
    { id: 'dap', name: 'DAP (ડીએપી)' }, { id: 'npk', name: 'NPK (એનપીકે)' },
    { id: 'urea', name: 'Urea (યુરિયા)' }, { id: 'zinc', name: 'Zinc (ઝીંક)' },
    { id: 'potash', name: 'Potash (પોટાશ)' }, { id: 'sulphur', name: 'Sulphur (સલ્ફર)' },
    { id: 'other', name: 'Other (અન્ય)' },
];
const diseaseOptions = [
    { id: 'pest', name: 'Pest (ઇયળ)' }, { id: 'rust', name: 'Rust (ગરો)' },
    { id: 'wilting', name: 'Wilting (સુકારો)' },
];
// --- Component Props and State ---
type CycleData = CropCycleForEmployee & { farm_id: number; first_visit_date: string | null };
type Props = { cycle: CycleData; };
const initialState = { message: '', success: false };

export default function VisitForm({ cycle }: Props) {
  const [activeTab, setActiveTab] = useState('visit1');
  const [state, formAction] = useActionState(createFarmVisit, initialState);
  const [gpsCoords, setGpsCoords] = useState('');
  const [showRoggingRemaining, setShowRoggingRemaining] = useState(false);

  const handleGetLocation = () => setGpsCoords('23.0225° N, 72.5714° E');

  return (
    <main className="max-w-xl mx-auto py-20 px-4">
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline/30 z-10">
        <div className="max-w-xl mx-auto flex items-center h-full px-4">
            <Link href="/employee/dashboard" className="p-2 -ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-on-surface"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h2 className="text-xl font-medium text-on-surface ml-2">{cycle.farmer_name}</h2>
        </div>
      </header>

      <form action={formAction} className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-3xl p-6">
        <input type="hidden" name="crop_cycle_id" value={cycle.crop_cycle_id} />
        <input type="hidden" name="farm_id" value={cycle.farm_id} />
        <input type="hidden" name="visit_number" value={activeTab === 'visit1' ? 1 : 2} />
        <input type="hidden" name="visit_date" value={new Date().toISOString().split('T')[0]} />

        {/* --- Tabs --- */}
        <div className="flex mb-6 bg-input-bg rounded-full p-1">
            <button type="button" onClick={() => setActiveTab('visit1')} className={`flex-1 py-3 px-4 rounded-full font-medium text-center ${activeTab === 'visit1' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>વિઝિટ ૧</button>
            <button type="button" onClick={() => setActiveTab('visit2')} className={`flex-1 py-3 px-4 rounded-full font-medium text-center ${activeTab === 'visit2' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>વિઝિટ ૨</button>
        </div>

        {/* --- Visit 1 Form --- */}
        <div className={`flex flex-col gap-5 ${activeTab === 'visit1' ? '' : 'hidden'}`}>
            <button type="button" onClick={handleGetLocation} className="w-full h-14 text-base font-medium rounded-full bg-secondary-container text-on-secondary-container hover:shadow-lg transition-shadow">ફાર્મનું લોકેશન મેળવો</button>
            <FloatingLabelInput id="gps-coords" name="gps_coords" label="GPS કોઓર્ડિનેટ્સ" value={gpsCoords} readOnly />
            <FloatingLabelInput id="rouging_percentage" name="rouging_percentage" label="રોગિંગ %" type="number" />
            <FloatingLabelInput id="irrigation_count" name="irrigation_count" label="પિયતની સંખ્યા" type="number" />
            
            <Fieldset legend="ખાતર">
                {fertilizerOptions.map(f => <Checkbox key={f.id} id={f.id} name="fertilizer_data" label={f.name} />)}
            </Fieldset>
            
            <FloatingLabelSelect id="crop_condition" name="crop_condition" label="પાકની સ્થિતિ"><option value="Good">સારી</option><option value="Medium">મધ્યમ</option><option value="Bad">ખરાબ</option></FloatingLabelSelect>
            
            <Fieldset legend="રોગ">
                {diseaseOptions.map(d => <Checkbox key={d.id} id={d.id} name="disease_data" label={d.name} />)}
            </Fieldset>
            
            <FloatingLabelSelect id="farmer_cooperation" name="farmer_cooperation" label="ખેડૂતનો સહકાર"><option value="Best">Best</option><option value="Good">Good</option><option value="Worst">Worst</option></FloatingLabelSelect>
            <FloatingLabelInput id="remarks" name="remarks" label="રિમાર્ક" />
            <FloatingLabelInput id="next_visit_days" name="next_visit_days" label="બીજી વિઝિટ માટેના દિવસો" type="number" />
        </div>

        {/* --- Visit 2 Form --- */}
        <div className={`flex flex-col gap-5 ${activeTab === 'visit2' ? '' : 'hidden'}`}>
            <p className="text-on-surface-variant">પહેલી વિઝિટની તારીખ: <span className="text-on-surface font-medium">{cycle.first_visit_date || 'N/A'}</span></p>

            <fieldset className="border-none p-0 m-0 flex flex-col gap-4">
                <legend className="text-base text-on-surface-variant mb-1">રોગિંગ થયું?</legend>
                <div className="flex gap-6">
                    <Radio id="rogging_yes" name="rogging_done" label="હા" onChange={() => setShowRoggingRemaining(true)} />
                    <Radio id="rogging_no" name="rogging_done" label="ના" onChange={() => setShowRoggingRemaining(false)} defaultChecked />
                </div>
            </fieldset>
            
            {showRoggingRemaining && <FloatingLabelInput id="rouging_remaining" name="rouging_remaining" label="બાકી રોગિંગ %" type="number" />}
            
            <FloatingLabelSelect id="crop_condition2" name="crop_condition" label="પાકની સ્થિતિ"><option value="Good">સારી</option><option value="Medium">મધ્યમ</option><option value="Bad">ખરાબ</option></FloatingLabelSelect>
            <FloatingLabelInput id="irrigation_count2" name="irrigation_count" label="પિયતની સંખ્યા" type="number" />
            <FloatingLabelSelect id="farmer_cooperation2" name="farmer_cooperation" label="ખેડૂતનો સહકાર"><option value="Best">Best</option><option value="Good">Good</option><option value="Worst">Worst</option></FloatingLabelSelect>
            <FloatingLabelInput id="remarks2" name="remarks" label="રિમાર્ક" />
        </div>
        
        <button type="submit" className="w-full h-14 mt-8 text-base font-medium rounded-full bg-primary text-on-primary hover:shadow-lg transition-shadow">વિઝિટ સેવ કરો</button>
        {state.message && <p className={`mt-4 text-center text-sm ${state.success ? 'text-green-600' : 'text-error'}`}>{state.message}</p>}
      </form>
    </main>
  );
}


// --- Reusable Form Components ---
const FloatingLabelInput = ({ id, label, ...props }: { id: string, label: string } & React.ComponentProps<'input'>) => (
    <div className="relative">
        <input id={id} className="block px-3 pb-2 pt-5 w-full text-base text-on-surface bg-input-bg/50 rounded-lg border-2 border-outline appearance-none focus:outline-none focus:ring-0 focus:border-primary peer" placeholder=" " {...props} />
        <label htmlFor={id} className="absolute text-base text-on-surface-variant duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">{label}</label>
    </div>
);

const FloatingLabelSelect = ({ id, label, children, ...props }: { id: string, label: string, children: React.ReactNode } & React.ComponentProps<'select'>) => (
    <div className="relative">
        <select id={id} className="block px-3 pb-2 pt-5 w-full text-base text-on-surface bg-input-bg/50 rounded-lg border-2 border-outline appearance-none focus:outline-none focus:ring-0 focus:border-primary peer" {...props}>
            <option value="" disabled></option>
            {children}
        </select>
        <label htmlFor={id} className="absolute text-base text-on-surface-variant duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">{label}</label>
    </div>
);

const Fieldset = ({ legend, children }: { legend: string, children: React.ReactNode }) => (
    <fieldset className="border-none p-0 m-0 flex flex-col gap-4">
        <legend className="text-base text-on-surface-variant">{legend}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-4">{children}</div>
    </fieldset>
);

const Checkbox = ({ id, name, label }: { id: string, name: string, label: string }) => (
    <label htmlFor={id} className="flex items-center cursor-pointer text-on-surface">
        <input id={id} name={name} type="checkbox" className="sr-only peer" />
        <div className="w-5 h-5 border-2 border-outline rounded flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary">
            <svg className="w-3 h-3 text-on-primary fill-current opacity-0 peer-checked:opacity-100" viewBox="0 0 16 16"><path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/></svg>
        </div>
        <span className="ml-3">{label}</span>
    </label>
);

const Radio = ({ id, name, label, ...props }: { id: string, name: string, label: string } & React.ComponentProps<'input'>) => (
    <label htmlFor={id} className="flex items-center cursor-pointer text-on-surface">
        <input id={id} name={name} type="radio" className="sr-only peer" {...props} />
        <div className="w-5 h-5 border-2 border-outline rounded-full flex items-center justify-center peer-checked:border-primary">
            <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100"></div>
        </div>
        <span className="ml-3">{label}</span>
    </label>
);