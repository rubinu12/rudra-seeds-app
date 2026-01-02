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
} from "lucide-react";
import { MODERN_THEMES } from "@/app/employee-v2/theme";
import { GUJARATI } from "@/app/employee-v2/translations";
import {
  saveDefaultLocation,
  getDefaultLocation,
} from "@/app/employee-v2/actions/user";

type Props = {
  location: string;
  setLocation: (loc: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

const LOCATIONS = [
  { id: "Farm", label: GUJARATI.loc_farm },
  { id: "Parabadi yard", label: GUJARATI.loc_parabadi },
  { id: "Dhoraji yard", label: GUJARATI.loc_dhoraji },
  { id: "Jalasar yard", label: GUJARATI.loc_jalasar },
];

export default function SmartHeader({
  location,
  setLocation,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
}: Props) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default Location State
  const [defaultLoc, setDefaultLoc] = useState("");
  const [saving, setSaving] = useState(false);

  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  // 1. Load Default Location on Mount
  useEffect(() => {
    getDefaultLocation().then((loc) => {
      if (loc) setDefaultLoc(loc);
    });
  }, []);

  // 2. Handle Setting Default
  const handleSetDefault = async (loc: string) => {
    setSaving(true);
    await saveDefaultLocation(loc);
    setDefaultLoc(loc); // Update local state
    setSaving(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div
      className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-md px-4 py-3 border-b ${theme.borderColor} shadow-sm transition-colors duration-300`}
    >
      {!isSearchOpen && !searchTerm ? (
        <div className="flex justify-between items-center animate-in fade-in duration-200 gap-3">
          {/* CUSTOM LOCATION DROPDOWN */}
          <div className="flex flex-col flex-1 min-w-0" ref={dropdownRef}>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">
              {GUJARATI.location}
            </span>

            <div className="relative">
              {/* Trigger Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 font-bold text-gray-900 text-lg outline-none cursor-pointer group"
              >
                {location}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* The Beautiful Floating Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  {/* List of Locations */}
                  <div className="py-2">
                    {LOCATIONS.map((loc) => {
                      const isSelected = location === loc.id;
                      return (
                        <button
                          key={loc.id}
                          onClick={() => {
                            setLocation(loc.id);
                            setIsDropdownOpen(false); // Close after selection
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-slate-50 text-slate-900 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{loc.id}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer: Set Default Toggle */}
                  <div className="border-t border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Star className="w-3 h-3" />
                        Set "{location}" as Default
                      </span>

                      {/* Toggle Switch */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Don't close menu
                          if (defaultLoc !== location)
                            handleSetDefault(location);
                        }}
                        disabled={saving || defaultLoc === location}
                        className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors duration-300 ${
                          defaultLoc === location
                            ? "bg-green-500"
                            : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                            defaultLoc === location
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    {saving && (
                      <p className="text-[10px] text-green-600 mt-1 font-medium text-center">
                        Saving preference...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-shrink-0 w-10 h-10 bg-white/60 rounded-full shadow-sm border border-black/5 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      ) : (
        // Search Mode
        <div className="flex gap-2 items-center animate-in zoom-in-95 duration-200 h-[52px]">
          <div className="flex-grow h-10 bg-white rounded-xl border border-slate-200 flex items-center px-3 shadow-sm focus-within:ring-2 focus-within:ring-rose-500/20">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={GUJARATI.search_placeholder}
              autoFocus
              className="flex-grow bg-transparent outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 h-full w-full"
            />
          </div>
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchTerm("");
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Tabs - Only show when NOT searching */}
      {!isSearchOpen && !searchTerm && (
        <div className="flex justify-between mt-4 overflow-x-auto no-scrollbar gap-2">
          {["sample", "weigh", "load"].map((id) => {
            const isActive = activeTab === id;
            const icons: any = { sample: Beaker, weigh: Scale, load: Truck };
            const labels: any = {
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
                  isActive
                    ? `border-gray-900 text-gray-900 font-bold`
                    : "border-transparent text-gray-500 font-medium scale-95 opacity-60"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "fill-slate-900" : ""}`}
                />
                <span className="text-[10px] uppercase tracking-wider">
                  {labels[id]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
