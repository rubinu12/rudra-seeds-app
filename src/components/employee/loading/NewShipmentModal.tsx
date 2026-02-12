"use client";

import { useState, useEffect, useRef , ElementType } from "react";
import { createShipment } from "@/src/app/employee/actions/shipments";
import {
  Truck,
  MapPin,
  Search,
  X,
  Check,
  Map as MapIcon,
  Loader2,
  Building2,
  Phone,
  User,
  Weight,
  ChevronDown,
  ChevronUp,
  Leaf
} from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

// --- STRICT TYPES ---

export interface SeedVariety {
  seed_id: number;
  variety_name: string;
}

export interface TransportCompany {
  id: number;
  name: string;
}

export interface DestinationCompany {
  id: number;
  name: string;
}

export interface Village {
  id: number;
  name: string;
}

export interface Landmark {
  id: number;
  name: string;
}

export interface MasterData {
  seeds: SeedVariety[];
  transportCos: TransportCompany[];
  destCos: DestinationCompany[];
  villages: Village[];
  landmarks: Landmark[];
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  onSuccess: () => void;
  masterData: MasterData | null;
};

type Option = {
  value: string | number;
  label: string;
};

// --- DATA ---
const LOCATION_OPTIONS: Option[] = [
  { value: "Farm", label: "Farm" },
  { value: "Parabadi yard", label: "Parabadi yard" },
  { value: "Dhoraji yard", label: "Dhoraji yard" },
  { value: "Jalasar yard", label: "Jalasar yard" },
];

// --- MICRO COMPONENTS ---

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-slate-800"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" /> Registering...
        </>
      ) : (
        <>
          <Truck className="w-5 h-5" /> Register Truck
        </>
      )}
    </button>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-xs font-bold uppercase text-slate-500 tracking-wide">
        {label}
      </span>
    </div>
  );
}

function SmartSelect({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = false,
  required = false
}: {
  label: string;
  icon?: ElementType;
  options: Option[];
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
  searchable?: boolean;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value == value);
  
  useEffect(() => {
    if (searchable && selectedOption && !isOpen) {
      setSearch(selectedOption.label);
    } else if (!searchable) {
       setSearch("");
    }
  }, [selectedOption, isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (searchable && selectedOption) {
            setSearch(selectedOption.label);
        } else if (searchable && !selectedOption) {
            setSearch("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchable, selectedOption]);

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
        {label}
      </label>
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Icon className={`w-4 h-4 transition-colors ${isOpen || value ? "text-slate-800" : "text-slate-400"}`} />
          </div>
        )}

        <div
            onClick={() => {
                setIsOpen(!isOpen);
                if (searchable && !isOpen) setSearch(""); 
            }}
            className={`
                w-full bg-white border rounded-xl py-3.5 pl-11 pr-10 
                font-bold text-slate-700 text-sm cursor-pointer transition-all shadow-sm
                flex items-center
                ${isOpen 
                    ? "border-slate-400 ring-4 ring-slate-100" 
                    : "border-slate-200 hover:border-slate-300"
                }
            `}
        >
            {searchable ? (
                <input
                    type="text"
                    value={isOpen ? search : (selectedOption?.label || "")}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className="w-full bg-transparent outline-none placeholder:text-slate-300 cursor-pointer"
                    onClick={(e) => e.stopPropagation()} 
                    onFocus={() => setIsOpen(true)}
                />
            ) : (
                <span className={selectedOption ? "text-slate-800" : "text-slate-400 font-medium"}>
                    {selectedOption?.label || placeholder}
                </span>
            )}
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
        </div>

        {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                {filtered.length > 0 ? (
                    filtered.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={`
                                p-3 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center justify-between
                                ${value === opt.value ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}
                            `}
                        >
                            {opt.label}
                            {value === opt.value && <Check className="w-4 h-4 text-slate-900" />}
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        No results found.
                    </div>
                )}
            </div>
        )}
      </div>

      {required && (
          <input 
            type="hidden" 
            name={label.toLowerCase().replace(/\s/g, '')} 
            value={value || ""} 
            required 
          />
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function NewShipmentModal({
  isOpen,
  onClose,
  location,
  onSuccess,
  masterData,
}: Props) {
  // Safe destructuring with types
  const seeds = masterData?.seeds || [];
  const transportCos = masterData?.transportCos || [];
  const destCos = masterData?.destCos || [];
  const landmarks = masterData?.landmarks || [];
  const villages = masterData?.villages || [];

  const [selectedLocation, setSelectedLocation] = useState(location || "Parabadi yard");
  const [selectedVillage, setSelectedVillage] = useState<string | number>("");
  const [selectedLandmark, setSelectedLandmark] = useState<string | number>("");
  const [selectedTransport, setSelectedTransport] = useState<string | number>("");
  const [selectedDest, setSelectedDest] = useState<string | number>("");
  
  const [seedSearch, setSeedSearch] = useState("");
  const [selectedSeedIds, setSelectedSeedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(location || "Parabadi yard");
      setSelectedVillage("");
      setSelectedLandmark("");
      setSelectedTransport("");
      setSelectedDest("");
      setSelectedSeedIds([]);
      setSeedSearch("");
    }
  }, [isOpen, location]);

  const toggleSeed = (id: number) => {
    setSelectedSeedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFormAction = async (formData: FormData) => {
    formData.set("location", selectedLocation);
    if(selectedTransport) formData.set("transportId", selectedTransport.toString());
    if(selectedDest) formData.set("destId", selectedDest.toString());
    
    if (selectedSeedIds.length === 0) {
      toast.error("Please select at least one seed variety.");
      return;
    }
    formData.append("seedIds", JSON.stringify(selectedSeedIds));

    if (selectedLocation === "Farm") {
      if (!selectedVillage) {
        toast.error("Please select a Village.");
        return;
      }
      formData.set("villageId", selectedVillage.toString());
      if (selectedLandmark) {
          formData.set("landmarkId", selectedLandmark.toString());
      }
    }

    const res = await createShipment(formData);
    if (res.success) {
      toast.success("Truck registered successfully!");
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || "Failed.");
    }
  };

  // Maps
  const villageOptions = villages.map((v) => ({ value: v.id, label: v.name }));
  const landmarkOptions = landmarks.map((l) => ({ value: l.id, label: l.name }));
  const transportOptions = transportCos.map((c) => ({ value: c.id, label: c.name }));
  const destOptions = destCos.map((c) => ({ value: c.id, label: c.name }));

  const filteredSeeds = seeds.filter((s) =>
    s.variety_name.toLowerCase().includes(seedSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              New Arrival
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Enter vehicle details for loading
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          action={handleFormAction}
          className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white"
        >
          <div className="p-6 space-y-8">
            <div>
              <SectionLabel icon={MapPin} label="Pickup Location" />
              <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <SmartSelect 
                    label="Yard / Farm"
                    icon={Building2}
                    options={LOCATION_OPTIONS}
                    value={selectedLocation}
                    onChange={(val) => setSelectedLocation(val as string)}
                    searchable={false}
                />
                {selectedLocation === "Farm" && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-2 fade-in">
                    <SmartSelect 
                        label="Select Village"
                        icon={MapIcon}
                        options={villageOptions}
                        value={selectedVillage}
                        onChange={setSelectedVillage}
                        placeholder="Search Village..."
                        searchable={true}
                    />
                    <SmartSelect 
                        label="Nearby Landmark (Optional)"
                        icon={Search}
                        options={landmarkOptions}
                        value={selectedLandmark}
                        onChange={setSelectedLandmark}
                        placeholder="Search Landmark..."
                        searchable={true}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <SectionLabel icon={Truck} label="Vehicle Details" />
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                 <div className="relative group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase absolute left-4 top-2.5">Vehicle Number</label>
                    <input
                        name="vehicleNo"
                        required
                        placeholder="GJ-03-AB-1234"
                        className="w-full pt-7 pb-2.5 px-4 bg-white border border-slate-200 rounded-xl font-black text-xl text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 uppercase placeholder:normal-case placeholder:text-slate-300 transition-all shadow-sm"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                        <input name="driverName" required placeholder="Driver Name" className="w-full pl-11 pr-3 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm" />
                    </div>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                        <input name="driverMobile" required placeholder="Mobile No" className="w-full pl-11 pr-3 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm" />
                    </div>
                 </div>
              </div>
            </div>

            <div>
               <SectionLabel icon={Building2} label="Logistics" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <SmartSelect 
                        label="Transport Co."
                        options={transportOptions}
                        value={selectedTransport}
                        onChange={setSelectedTransport}
                        placeholder="Select..."
                        searchable={true} 
                   />
                   <SmartSelect 
                        label="Destination"
                        options={destOptions}
                        value={selectedDest}
                        onChange={setSelectedDest}
                        placeholder="Select..."
                        searchable={true} 
                   />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase flex gap-1 items-center ml-1"><Weight className="w-3 h-3"/> Cap(Ton)</label>
                   <input name="capacity" type="number" step="0.1" required placeholder="20" className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-900 outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all text-center shadow-sm" />
                </div>
                
                <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex justify-between items-center ml-1">
                        <span className="flex items-center gap-1"><Leaf className="w-3 h-3"/> Allowed Seeds</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">{selectedSeedIds.length}</span>
                    </label>
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 max-h-56 overflow-y-auto custom-scrollbar shadow-inner">
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                              type="text"
                              placeholder="Find seeds..."
                              value={seedSearch}
                              onChange={(e) => setSeedSearch(e.target.value)}
                              className="w-full text-xs py-2 pl-8 pr-2 bg-slate-50 rounded-lg outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-colors font-medium"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filteredSeeds.map((s) => {
                                const isSelected = selectedSeedIds.includes(s.seed_id);
                                return (
                                    <button
                                        key={s.seed_id}
                                        type="button"
                                        onClick={() => toggleSeed(s.seed_id)}
                                        className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 active:scale-95 touch-manipulation
                                          ${isSelected 
                                            ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 ring-2 ring-slate-100" 
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                                    >
                                        {isSelected && <Check className="w-4 h-4" />}
                                        {s.variety_name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

          </div>
          
          <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20">
              <SubmitButton />
          </div>
        </form>

      </div>
    </div>
  );
}