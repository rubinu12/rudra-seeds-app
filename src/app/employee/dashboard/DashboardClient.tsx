"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SmartHeader from "@/src/components/employee/SmartHeader";
import UniversalCard from "@/src/components/employee/UniversalCard";
import SampleTab from "@/src/components/employee/tabs/SampleTab";
import WeighingTab from "@/src/components/employee/tabs/WeighingTab";
import LoadTab from "@/src/components/employee/tabs/LoadTab";

import { searchGlobalCycles } from "@/src/app/employee/actions/search";
import { markAsHarvested } from "@/src/app/employee/actions/harvest";
import { markSampleReceived } from "@/src/app/employee/actions/sample";
import { MODERN_THEMES } from "@/src/app/employee/theme";
import { GUJARATI } from "@/src/app/employee/translations";
import { useDebounce } from "@/src/hooks/useDebounce";
import { LoaderCircle, SearchX } from "lucide-react";

interface DashboardClientProps {
  initialLocation: string;
}

export default function DashboardClient({
  initialLocation,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sample");
  
  // --- GLOBAL FILTERS ---
  const [location, setLocation] = useState(initialLocation || "Farm");
  const [selectedVillage, setSelectedVillage] = useState("All"); // <--- Lifted State

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    localStorage.setItem("defaultLocation", newLoc);
    // Reset village when location changes to avoid confusion
    if(newLoc !== 'Farm') setSelectedVillage("All");
  };

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true);
      searchGlobalCycles(debouncedSearch).then((data) => {
        setSearchResults(data);
        setIsSearching(false);
      });
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearch]);

  const handleAction = async (
    cycleId: number,
    currentStatus: string,
    collectionLoc?: string,
  ) => {
    if (currentStatus === "Growing" && collectionLoc) {
      await markAsHarvested(cycleId, collectionLoc);
      const updated = await searchGlobalCycles(debouncedSearch);
      setSearchResults(updated);
    } else if (currentStatus === "Harvested") {
      await markSampleReceived(cycleId);
      if (searchTerm) {
        const updated = await searchGlobalCycles(debouncedSearch);
        setSearchResults(updated);
      } else {
        window.location.reload();
      }
    } else if (currentStatus === "Sample Collected") {
      router.push(`/employee/sample/${cycleId}`);
    }
  };

  return (
    <div className={`flex-grow ${theme.bg} transition-colors duration-500 min-h-screen`}>
      
      {/* --- SMART HEADER WITH GLOBAL FILTERS --- */}
      <SmartHeader
        location={location}
        setLocation={handleLocationChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        // Pass Village Props
        selectedVillage={selectedVillage}
        setSelectedVillage={setSelectedVillage}
      />

      <main className="px-4 py-4 space-y-4 pb-24">
        {searchTerm ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <LoaderCircle className="w-8 h-8 animate-spin mb-2 text-slate-500" />
                <p className="text-xs font-medium text-slate-400">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest pl-1 mb-3">
                  Found {searchResults.length} Results
                </p>
                {searchResults.map((item) => (
                  <UniversalCard
                    key={item.crop_cycle_id}
                    data={item}
                    location={location}
                    onAction={(loc?: string) =>
                      handleAction(item.crop_cycle_id, item.status, loc)
                    }
                  />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-40 text-center">
                <SearchX className="w-12 h-12 mb-3 text-slate-400" />
                <p className="font-bold text-slate-600">{GUJARATI.no_results}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* PASS FILTERS TO TABS */}
            {activeTab === "sample" && (
                <SampleTab location={location} selectedVillage={selectedVillage} />
            )}

            {activeTab === "weigh" && (
              <WeighingTab collectionFilter={location} selectedVillage={selectedVillage} />
            )}

            {/* Load Tab usually doesn't need village filter as strictly, or handles it internally */}
            {activeTab === "load" && <LoadTab location={location} />}
          </>
        )}
      </main>
    </div>
  );
}