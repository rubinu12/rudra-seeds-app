"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SmartHeader from "@/components/employee-v2/SmartHeader";
import UniversalCard from "@/components/employee-v2/UniversalCard";
import SampleTab from "@/components/employee-v2/tabs/SampleTab";

// Actions
import { searchGlobalCycles } from "@/app/employee-v2/actions/search";
import { markAsHarvested } from "@/app/employee-v2/actions/harvest";
import { markSampleReceived } from "@/app/employee-v2/actions/sample";

// Utils
import { MODERN_THEMES } from "@/app/employee-v2/theme";
import { GUJARATI } from "@/app/employee-v2/translations";
import { useDebounce } from "@/hooks/useDebounce";
import { LoaderCircle, SearchX } from "lucide-react";

// New Prop Interface
interface DashboardClientProps {
  initialLocation: string;
}

export default function DashboardClient({
  initialLocation,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sample");

  // FIX: Initialize state directly from the Server Prop. No Loading Screen needed!
  const [location, setLocation] = useState(initialLocation || "Farm");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fallback theme safety
  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];

  // Handle Local Storage (Backup) + State Update
  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    localStorage.setItem("defaultLocation", newLoc);
  };

  // Search Effect
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
    collectionLoc?: string
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
      router.push(`/employee-v2/sample/${cycleId}`);
    }
  };

  return (
    <div
      className={`flex-grow ${theme.bg} transition-colors duration-500 min-h-screen`}
    >
      <SmartHeader
        location={location}
        setLocation={handleLocationChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <main className="px-4 py-4 space-y-4 pb-24">
        {searchTerm ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <LoaderCircle className="w-8 h-8 animate-spin mb-2 text-slate-500" />
                <p className="text-xs font-medium text-slate-400">
                  Searching database...
                </p>
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
                <p className="font-bold text-slate-600">
                  {GUJARATI.no_results}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {activeTab === "sample" && <SampleTab location={location} />}
            {activeTab === "weigh" && (
              <div className="text-center opacity-40 mt-10 text-sm">
                Weigh List Coming Soon
              </div>
            )}
            {activeTab === "load" && (
              <div className="text-center opacity-40 mt-10 text-sm">
                Load List Coming Soon
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
