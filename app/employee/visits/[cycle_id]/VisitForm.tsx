"use client";

import { useState, useActionState, useEffect } from 'react';
import { createFarmVisit } from '../actions';
import { CycleForVisit, FarmerByLandmark, CropCycleForEmployee } from '@/lib/definitions';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowLeft, Search, MapPin, Calendar, Wheat, ChevronsUpDown, LoaderCircle, X } from 'lucide-react';

// --- Hardcoded Options ---
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

const initialState = { message: '', success: false };

// --- Helper Function ---
function calculateDaysSinceSowing(sowingDate: string): number {
  const sowDate = new Date(sowingDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - sowDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// --- Main Component ---
export default function VisitForm({ cycle }: { cycle: CycleForVisit }) {
  const [activeTab, setActiveTab] = useState('visit1');
  const [state, formAction] = useActionState(createFarmVisit, initialState);
  const [location, setLocation] = useState({ lat: '', lon: '', display: 'Not Captured' });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showRoggingRemaining, setShowRoggingRemaining] = useState(false);
  const [isHeaderSearchVisible, setHeaderSearchVisible] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, display: 'Geolocation not supported' }));
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude.toFixed(6), lon: longitude.toFixed(6), display: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E` });
        setIsGettingLocation(false);
      },
      () => {
        setLocation(prev => ({ ...prev, display: 'Unable to retrieve location' }));
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-surface/30">
      <VisitHeader 
        farmerName={cycle.farmer_name} 
        isSearchVisible={isHeaderSearchVisible}
        setSearchVisible={setHeaderSearchVisible}
      />
      
      <main className="flex-grow overflow-y-auto pb-8">
        <CycleDetails cycle={cycle} />
        
        <form action={formAction} className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-3xl p-6 mx-4">
          <input type="hidden" name="crop_cycle_id" value={cycle.crop_cycle_id} />
          <input type="hidden" name="farm_id" value={cycle.farm_id} />
          <input type="hidden" name="visit_number" value={activeTab === 'visit1' ? 1 : 2} />
          <input type="hidden" name="visit_date" value={new Date().toISOString().split('T')[0]} />
          <input type="hidden" name="gps_latitude" value={location.lat} />
          <input type="hidden" name="gps_longitude" value={location.lon} />

          <div className="flex mb-6 bg-input-bg rounded-full p-1">
              <button type="button" onClick={() => setActiveTab('visit1')} className={`flex-1 py-3 px-4 rounded-full font-medium text-center ${activeTab === 'visit1' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>વિઝિટ ૧</button>
              <button type="button" onClick={() => setActiveTab('visit2')} className={`flex-1 py-3 px-4 rounded-full font-medium text-center ${activeTab === 'visit2' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}>વિઝિટ ૨</button>
          </div>

          <div className={`flex flex-col gap-5 ${activeTab === 'visit1' ? '' : 'hidden'}`}>
              <button type="button" onClick={handleGetLocation} className="w-full h-14 text-base font-medium rounded-full bg-secondary-container text-on-secondary-container hover:shadow-lg transition-shadow" disabled={isGettingLocation}>
                {isGettingLocation ? 'Fetching Location...' : 'ફાર્મનું લોકેશન મેળવો'}
              </button>
              <FloatingLabelInput id="gps-coords" name="gps_coords_display" label="GPS કોઓર્ડિનેટ્સ" value={location.display} readOnly />
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
    </div>
  );
}

// --- Sub-Components ---

function VisitHeader({ farmerName, isSearchVisible, setSearchVisible }: { farmerName: string, isSearchVisible: boolean, setSearchVisible: (v: boolean) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CropCycleForEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch && isSearchVisible) {
      setIsLoading(true);
      fetch(`/api/cycles/search?query=${debouncedSearch}`)
        .then(res => res.json())
        .then(data => setResults(data))
        .finally(() => setIsLoading(false));
    } else {
      setResults([]);
    }
  }, [debouncedSearch, isSearchVisible]);

  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline/30 z-10">
      <div className="max-w-xl mx-auto flex items-center h-full px-4 relative">
        <button onClick={() => isSearchVisible ? setSearchVisible(false) : window.history.back()} className="p-2 -ml-2">
            <ArrowLeft className="text-on-surface" />
        </button>
        
        {!isSearchVisible ? (
          <>
            <h2 className="text-xl font-medium text-on-surface ml-2 truncate">{farmerName}</h2>
            <button onClick={() => setSearchVisible(true)} className="p-2 ml-auto">
              <Search className="text-on-surface" />
            </button>
          </>
        ) : (
          <div className="relative w-full ml-2">
             <input
              type="text"
              placeholder="બીજા ખેડૂતને શોધો..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-full bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="absolute top-0 right-0 h-10 w-10 grid place-items-center">
              {isLoading ? <LoaderCircle className="w-5 h-5 text-on-surface-variant animate-spin" /> : <Search className="w-5 h-5 text-on-surface-variant" />}
            </div>
          </div>
        )}

        {isSearchVisible && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-surface-container border border-outline rounded-2xl shadow-lg max-h-80 overflow-y-auto z-20">
            {results.map(cycle => (
              <Link key={cycle.crop_cycle_id} href={`/employee/visits/${cycle.crop_cycle_id}`} className="block px-4 py-3 hover:bg-primary/10 border-b border-outline/30 last:border-b-0">
                <p className="font-medium text-on-surface">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.farm_location}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function CycleDetails({ cycle }: { cycle: CycleForVisit }) {
  const [isLandmarkSectionOpen, setLandmarkSectionOpen] = useState(false);
  const [landmarkFarmers, setLandmarkFarmers] = useState<FarmerByLandmark[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const daysSinceSowing = calculateDaysSinceSowing(cycle.sowing_date);

  const handleLandmarkClick = () => {
    if (isLandmarkSectionOpen) {
      setLandmarkSectionOpen(false);
      return;
    }
    setIsFetching(true);
    fetch(`/api/cycles/search?landmarkId=${cycle.landmark_id}&exclude=${cycle.crop_cycle_id}`)
      .then(res => res.json())
      .then(data => {
        setLandmarkFarmers(data);
        setLandmarkSectionOpen(true);
      })
      .finally(() => setIsFetching(false));
  };
  
  return (
    <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-3xl p-5 mx-4 my-6">
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
        <div className="flex items-start gap-2">
          <Wheat className="w-4 h-4 mt-0.5 text-on-surface-variant" />
          <div>
            <p className="text-on-surface-variant">વેરાયટી</p>
            <p className="text-on-surface font-medium">{cycle.seed_variety}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-0.5 text-on-surface-variant" />
          <div>
            <p className="text-on-surface-variant">વાવણીના દિવસો</p>
            <p className="text-on-surface font-medium">{daysSinceSowing} દિવસ</p>
          </div>
        </div>
        <div className="col-span-2 flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-on-surface-variant flex-shrink-0" />
          <div>
            <p className="text-on-surface-variant">ફાર્મનું સરનામું</p>
            <p className="text-on-surface font-medium">{cycle.farm_location}</p>
          </div>
        </div>
      </div>
      
      <button onClick={handleLandmarkClick} className="w-full mt-4 flex justify-between items-center text-left bg-secondary-container/50 p-3 rounded-full text-on-secondary-container">
        <span className="font-medium pl-1">{isFetching ? 'Loading...' : cycle.landmark_name}</span>
        <ChevronsUpDown className={`w-5 h-5 transition-transform ${isLandmarkSectionOpen ? 'rotate-180' : ''}`} />
      </button>

      {isLandmarkSectionOpen && (
        <div className="mt-4 space-y-3 pt-3 border-t border-outline/30">
          {landmarkFarmers.length > 0 ? landmarkFarmers.map(farmer => (
            <Link key={farmer.crop_cycle_id} href={`/employee/visits/${farmer.crop_cycle_id}`} className="block p-3 rounded-xl hover:bg-surface-container">
              <p className="font-semibold text-on-surface">{farmer.farmer_name}</p>
              <p className="text-xs text-on-surface-variant">{farmer.mobile_number}</p>
              <p className="text-sm text-on-surface-variant mt-1">{farmer.seed_variety} • {farmer.farm_location}</p>
            </Link>
          )) : (
            <p className="text-center text-sm text-on-surface-variant py-2">આ લેન્ડમાર્ક પર બીજા કોઈ ખેડૂત નથી.</p>
          )}
        </div>
      )}
    </div>
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