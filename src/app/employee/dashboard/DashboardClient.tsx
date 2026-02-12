"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SmartHeader from "@/src/components/employee/SmartHeader";
import UniversalCard from "@/src/components/employee/UniversalCard";
import SampleTab, { SampleTabItem } from "@/src/components/employee/tabs/SampleTab";
import WeighingTab, { WeighingItem } from "@/src/components/employee/tabs/WeighingTab";
import LoadTab from "@/src/components/employee/tabs/LoadTab";

import { searchGlobalCycles } from "@/src/app/employee/actions/search";
import { markAsHarvested } from "@/src/app/employee/actions/harvest";
import { markSampleReceived } from "@/src/app/employee/actions/sample";
import { MODERN_THEMES } from "@/src/app/employee/theme";
import { GUJARATI } from "@/src/app/employee/translations";
import { useDebounce } from "@/src/hooks/useDebounce";
import { LoaderCircle, SearchX } from "lucide-react";
import { CropCycleForEmployee } from "@/src/lib/definitions";
import { ActiveShipment } from "@/src/app/employee/actions/shipments";
// Import the new interface
import { MasterData } from "@/src/components/employee/loading/NewShipmentModal";

// Define strict types for the props
interface DashboardClientProps {
  initialLocation: string;
  initialSamples: SampleTabItem[]; // Strict Type
  initialWeighings: WeighingItem[]; // Strict Type
  initialShipments: ActiveShipment[];
  masterData: MasterData | null; // Strict type
}

export default function DashboardClient({
  initialLocation,
  initialSamples,
  initialWeighings,
  initialShipments,
  masterData
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sample");
  
  const [location, setLocation] = useState(initialLocation || "Farm");
  const [selectedVillage, setSelectedVillage] = useState("All"); 

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CropCycleForEmployee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    localStorage.setItem("defaultLocation", newLoc);
    if(newLoc !== 'Farm') setSelectedVillage("All");
  };

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true);
      searchGlobalCycles(debouncedSearch).then((data) => {
        setSearchResults(data as CropCycleForEmployee[]);
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
      setSearchResults(updated as CropCycleForEmployee[]);
      router.refresh(); 
    } else if (currentStatus === "Harvested") {
      await markSampleReceived(cycleId);
      if (searchTerm) {
        const updated = await searchGlobalCycles(debouncedSearch);
        setSearchResults(updated as CropCycleForEmployee[]);
      } 
      router.refresh(); 
    } else if (currentStatus === "Sample Collected") {
      router.push(`/employee/sample/${cycleId}`);
    }
  };

  return (
    <div className={`flex-grow ${theme.bg} transition-colors duration-500 min-h-screen`}>
      <SmartHeader
        location={location}
        setLocation={handleLocationChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
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
            {activeTab === "sample" && (
                <SampleTab 
                  location={location} 
                  selectedVillage={selectedVillage} 
                  initialData={initialSamples}
                />
            )}

            {activeTab === "weigh" && (
              <WeighingTab 
                collectionFilter={location} 
                selectedVillage={selectedVillage} 
                initialData={initialWeighings}
              />
            )}

            {activeTab === "load" && (
              <LoadTab 
                location={location} 
                initialData={initialShipments}
                masterData={masterData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}