"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Beaker,
  Scale,
  Truck,
  ChevronDown,
  Check,
  Star,
  MapPin,
  Filter,
  LucideIcon,
} from "lucide-react";
import { MODERN_THEMES } from "@/src/app/employee/theme";
import { GUJARATI } from "@/src/app/employee/translations";
import {
  saveDefaultLocation,
  getDefaultLocation,
} from "@/src/app/employee/actions/user";
import { getAllVillages } from "@/src/app/employee/actions/shipments";

type Props = {
  location: string;
  setLocation: (loc: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
};

const LOCATIONS = [
  { id: "Farm", label: GUJARATI.loc_farm },
  { id: "Parabadi yard", label: GUJARATI.loc_parabadi },
  { id: "Dhoraji yard", label: GUJARATI.loc_dhoraji },
  { id: "Jalasar yard", label: GUJARATI.loc_jalasar },
];

const VILLAGE_CACHE_KEY = "rudra_villages_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function SmartHeader({
  location,
  setLocation,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  selectedVillage,
  setSelectedVillage,
}: Props) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showVillagePicker, setShowVillagePicker] = useState(false);
  const [allVillages, setAllVillages] = useState<string[]>([]);
  const [villageSearch, setVillageSearch] = useState("");

  const [defaultLoc, setDefaultLoc] = useState("");
  const [saving, setSaving] = useState(false);

  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  useEffect(() => {
    getDefaultLocation().then((loc) => {
      if (loc) setDefaultLoc(loc);
    });
    loadVillages();
  }, []);

  const loadVillages = async () => {
    const now = Date.now();
    const cached = localStorage.getItem(VILLAGE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < CACHE_DURATION) {
        setAllVillages(parsed.data);
        getAllVillages().then((fresh) => {
            if(JSON.stringify(fresh) !== JSON.stringify(parsed.data)) {
                setAllVillages(fresh);
                localStorage.setItem(VILLAGE_CACHE_KEY, JSON.stringify({timestamp: now, data: fresh}));
            }
        });
        return;
      }
    }
    const fresh = await getAllVillages();
    setAllVillages(fresh);
    localStorage.setItem(VILLAGE_CACHE_KEY, JSON.stringify({ timestamp: now, data: fresh }));
  };

  const handleSetDefault = async (loc: string) => {
    setSaving(true);
    await saveDefaultLocation(loc);
    setDefaultLoc(loc);
    setSaving(false);
  };

  return (
    <div className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-md px-4 py-3 border-b ${theme.borderColor} shadow-sm transition-colors duration-300`}>
      
      {!isSearchOpen && !searchTerm ? (
        <div className="flex justify-between items-center gap-3">
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 font-black text-gray-900 text-lg leading-none truncate"
              >
                {LOCATIONS.find(l => l.id === location)?.label || location}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isDropdownOpen && (
                <>
                 <div className="fixed inset-0 z-[60]" onClick={() => setIsDropdownOpen(false)} />
                 <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[70] animate-in fade-in zoom-in-95">
                  <div className="py-2">
                    {LOCATIONS.map((loc) => {
                      const isSelected = location === loc.id;
                      return (
                        <button
                          key={loc.id}
                          onClick={() => {
                            setLocation(loc.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                            isSelected ? "bg-slate-50 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{loc.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-green-600" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50 p-3 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex gap-1"><Star className="w-3 h-3"/> Default</span>
                      <button 
                        onClick={() => handleSetDefault(location)} 
                        disabled={defaultLoc === location || saving}
                        className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${defaultLoc === location ? 'bg-green-500' : 'bg-slate-300'}`}
                      >
                         <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${defaultLoc === location ? 'translate-x-3' : 'translate-x-0'}`} />
                      </button>
                  </div>
                </div>
                </>
              )}
            </div>

            {location === "Farm" && (
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowVillagePicker(!showVillagePicker);
                            setVillageSearch("");
                        }}
                        className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                            selectedVillage !== "All"
                                ? "bg-white text-purple-700 border-purple-200 shadow-sm"
                                : "bg-black/5 text-slate-600 border-transparent hover:bg-black/10"
                        }`}
                    >
                        <Filter className="w-3 h-3" />
                        <span className="max-w-[80px] truncate">{selectedVillage === "All" ? "બધા ગામ" : selectedVillage}</span>
                    </button>

                    {showVillagePicker && (
                        <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setShowVillagePicker(false)} />
                            <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 z-[70] overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-2 border-b border-slate-100 bg-slate-50">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            autoFocus
                                            value={villageSearch}
                                            onChange={(e) => setVillageSearch(e.target.value)}
                                            placeholder="ગામ શોધો..."
                                            className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {["All", ...allVillages].filter(v => v === "All" || v.toLowerCase().includes(villageSearch.toLowerCase())).map(v => (
                                        <div
                                            key={v}
                                            onClick={() => { setSelectedVillage(v); setShowVillagePicker(false); }}
                                            className={`p-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer text-xs font-bold flex justify-between ${selectedVillage === v ? "bg-purple-50 text-purple-700" : "text-slate-700"}`}
                                        >
                                            <span>{v === "All" ? "બધા ગામ (All)" : v}</span>
                                            {selectedVillage === v && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-shrink-0 w-10 h-10 bg-white/60 rounded-full shadow-sm border border-black/5 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200 h-[52px]">
          <div className="flex-grow h-10 bg-white rounded-xl border border-slate-200 flex items-center px-3 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={GUJARATI.search_placeholder}
              autoFocus
              className="flex-grow bg-transparent outline-none text-sm font-medium text-slate-900"
            />
          </div>
          <button onClick={() => { setIsSearchOpen(false); setSearchTerm(""); }} className="w-10 h-10 flex items-center justify-center text-slate-500 bg-white rounded-full shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {!isSearchOpen && !searchTerm && (
        <div className="flex justify-between mt-4 overflow-x-auto no-scrollbar gap-2">
          {["sample", "weigh", "load"].map((id) => {
            const isActive = activeTab === id;
            // FIXED: Typed dictionaries
            const icons: Record<string, LucideIcon> = { sample: Beaker, weigh: Scale, load: Truck };
            const labels: Record<string, string> = {
              sample: GUJARATI.tab_sample,
              weigh: GUJARATI.tab_weigh,
              load: GUJARATI.tab_load,
            };
            const Icon = icons[id];

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 pb-2 border-b-2 transition-all ${
                  isActive ? `border-gray-900 text-gray-900 font-bold` : "border-transparent text-gray-500 font-medium scale-95 opacity-60"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "fill-slate-900" : ""}`} />
                <span className="text-[10px] uppercase tracking-wider">{labels[id]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}