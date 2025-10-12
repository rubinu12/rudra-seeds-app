"use client";

import { useState, useEffect } from 'react';
import { FarmerDetails } from '@/lib/definitions';
import { User, Search, LoaderCircle, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

function Input(props: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  const { id, label, className, ...rest } = props;
  return (
    // FIX: Added background color to input container
    <div className={`relative bg-input-bg/80 border border-outline rounded-lg h-14 focus-within:border-primary focus-within:border-2 ${className}`}>
      <input id={id} className="w-full h-full pt-5 px-4 bg-transparent outline-none text-on-surface peer" placeholder=" " {...rest} />
      <label htmlFor={id} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-primary peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:text-xs">
        {label}
      </label>
    </div>
  );
}

function Textarea(props: React.ComponentPropsWithoutRef<'textarea'> & { label: string }) {
    const { id, label, className, ...rest } = props;
    return (
      // FIX: Added background color to input container
      <div className={`relative bg-input-bg/80 border border-outline rounded-lg focus-within:border-primary focus-within:border-2 ${className}`}>
        <textarea id={id} className="w-full h-full py-4 px-4 bg-transparent outline-none text-on-surface peer" placeholder=" " {...rest} />
        <label htmlFor={id} className="absolute left-4 top-4 text-on-surface-variant pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-4 peer-focus:text-xs peer-focus:text-primary peer-[&:not(:placeholder-shown)]:top-4 peer-[&:not(:placeholder-shown)]:text-xs">
          {label}
        </label>
      </div>
    );
  }

type FarmerSearchResult = Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>;
type Props = { onFarmerSelect: (f: FarmerDetails | null) => void; selectedFarmer: FarmerDetails | null; };

export default function FarmerDetailsForm({ onFarmerSelect, selectedFarmer }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FarmerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const fetchFarmers = async () => {
      if (debouncedQuery.length < 2) { setResults([]); setDropdownOpen(false); return; }
      setIsLoading(true);
      const res = await fetch(`/api/farmers/search?query=${debouncedQuery}`);
      const data = await res.json();
      setResults(data); setDropdownOpen(data.length > 0); setIsLoading(false);
    };
    if (!selectedFarmer) fetchFarmers();
  }, [debouncedQuery, selectedFarmer]);

  const handleSelect = async (farmer: FarmerSearchResult) => {
    setIsLoading(true); setQuery(farmer.mobile_number); setDropdownOpen(false);
    const res = await fetch(`/api/farmers/${farmer.farmer_id}/details`);
    onFarmerSelect(await res.json()); setIsLoading(false);
  };
  
  const handleClear = () => { onFarmerSelect(null); setQuery(''); };

  useEffect(() => { if (selectedFarmer) setQuery(selectedFarmer.mobile_number); }, [selectedFarmer]);

  const farmerKey = selectedFarmer?.farmer_id || 'new';

  return (
    // FIX: Added background color to card
    <div className="bg-surface-container rounded-m3-xlarge p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 grid place-items-center rounded-2xl bg-primary-container">
          <User className="w-6 h-6 text-on-primary-container" />
        </div>
        <h2 className="text-3xl font-normal text-on-surface">Farmer & Farm Details</h2>
      </div>

      {selectedFarmer && <input type="hidden" name="farmer_id" value={selectedFarmer.farmer_id} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative md:col-span-2">
            <Input id="phone" name="mobile_number" label="Phone No." type="tel" value={query} onChange={(e) => setQuery(e.target.value)} readOnly={!!selectedFarmer} />
            <div className="absolute top-0 right-4 h-full flex items-center z-10">
                {isLoading && <LoaderCircle className="h-5 w-5 text-on-surface-variant animate-spin" />}
                {!isLoading && !selectedFarmer && <Search className="h-5 w-5 text-on-surface-variant" />}
                {selectedFarmer && (<button type="button" onClick={handleClear} className="p-1 rounded-full hover:bg-black/10"><X className="h-5 w-5 text-on-surface-variant"/></button>)}
            </div>
            {isDropdownOpen && <div className="absolute z-20 w-full mt-1 bg-surface-container border border-outline rounded-lg shadow-lg">
                {results.map((f, i) => (
                    <div key={f.farmer_id} onClick={() => handleSelect(f)} className={`px-4 py-3 cursor-pointer hover:bg-primary-container/50 ${i > 0 ? 'border-t border-outline/20' : ''}`}>
                        <p className="font-medium text-on-surface">{f.name}</p>
                        <p className="text-sm text-on-surface-variant">{f.mobile_number}</p>
                    </div>
                ))}
            </div>}
        </div>
        
        <Input id="farmerName" name="farmer_name" label="Name of Farmer" defaultValue={selectedFarmer?.name} key={`name-${farmerKey}`} required />
        <Input id="village" name="village" label="Village of Farmer" defaultValue={selectedFarmer?.village} key={`village-${farmerKey}`} required />
        <Input id="aadhar" name="aadhar_number" label="Adhar No. of Farmer" defaultValue={selectedFarmer?.aadhar_number} key={`aadhar-${farmerKey}`} required />
        <div className="md:col-span-2"><Textarea id="farmAddress" name="farm_address" label="Farm Address" key={`farm-addr-${farmerKey}`} className="h-32" /></div>
        <Textarea id="homeAddress" name="home_address" label="Home Address" defaultValue={selectedFarmer?.home_address} key={`home-addr-${farmerKey}`} className="h-24" required />
        <Input id="area" name="area_in_vigha" label="Area of Farm (Vigha)" type="number" key={`area-${farmerKey}`} className="h-24" />
      </div>
    </div>
  );
}