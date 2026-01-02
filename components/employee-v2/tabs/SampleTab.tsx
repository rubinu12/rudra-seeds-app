"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UniversalCard from "@/components/employee-v2/UniversalCard";
import {
  getPendingSamples,
  markSampleReceived,
} from "@/app/employee-v2/actions/sample";
import { Search, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { GUJARATI } from "@/app/employee-v2/translations";

export default function SampleTab({ location }: { location: string }) {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [isOthersOpen, setIsOthersOpen] = useState(false);

  // Load ALL Data (Once)
  async function load() {
    setLoading(true);
    const res = await getPendingSamples(); // Fetch everything
    setData(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []); // Only load on mount, not on location change (we filter locally)

  const handleTabAction = async (item: any) => {
    if (item.status === "Harvested") {
      await markSampleReceived(item.crop_cycle_id);
      // Quick refresh of data
      const res = await getPendingSamples();
      setData(res);
    } else if (item.status === "Sample Collected") {
      router.push(`/employee-v2/sample/${item.crop_cycle_id}`);
    }
  };

  // --- THE FILTER LOGIC ---

  // 1. Search Filter (First layer)
  const searchFiltered = data.filter((item) => {
    if (!localSearch) return true;
    const term = localSearch.toLowerCase();
    return (
      item.farmer_name?.toLowerCase().includes(term) ||
      item.village_name?.toLowerCase().includes(term)
    );
  });

  // 2. Logic to match User's Header Location
  const isLocationMatch = (itemLoc: string | null) => {
    // Normalize strings
    const current = location.toLowerCase().replace(" yard", "").trim();
    const item = (itemLoc || "Farm").toLowerCase().replace(" yard", "").trim();

    return item.includes(current);
  };

  // 3. Split into "My List" vs "Others"
  const assignedList = searchFiltered.filter((item) => {
    const locationMatches = isLocationMatch(item.collection_loc);
    return locationMatches && item.is_assigned; // Must match BOTH
  });

  const otherList = searchFiltered.filter((item) => {
    const locationMatches = isLocationMatch(item.collection_loc);
    return !(locationMatches && item.is_assigned); // Everything else
  });

  if (loading)
    return (
      <div className="p-10 text-center text-slate-400">Loading list...</div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter list..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none"
        />
      </div>

      {/* PRIMARY LIST (Matches Location + Assigned) */}
      {assignedList.length > 0 ? (
        assignedList.map((item) => (
          <UniversalCard
            key={item.crop_cycle_id}
            data={item}
            location={location}
            onAction={() => handleTabAction(item)}
          />
        ))
      ) : (
        <div className="py-6 text-center opacity-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            No assigned tasks at {location}
          </p>
        </div>
      )}

      {/* OTHERS LIST (Everything Else) */}
      {otherList.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setIsOthersOpen(!isOthersOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 rounded-xl text-slate-600 border border-slate-200"
          >
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Other / Different Location ({otherList.length})
            </span>
            {isOthersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isOthersOpen && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {otherList.map((item) => (
                <UniversalCard
                  key={item.crop_cycle_id}
                  data={item}
                  location={location}
                  onAction={() => handleTabAction(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
