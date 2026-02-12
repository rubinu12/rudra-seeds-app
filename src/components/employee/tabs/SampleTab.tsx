"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import UniversalCard, { CardData } from "@/src/components/employee/UniversalCard";
import {
  getPendingSamples,
  markSampleReceived,
} from "@/src/app/employee/actions/sample";
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LoaderCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// --- EXPORTED TYPE (For DashboardClient) ---
export type SampleTabItem = CardData & {
    collection_loc: string | null;
    is_assigned: boolean;
};

const LOCAL_TXT = {
  search_placeholder: "ખેડૂતનું નામ શોધો...",
  loading: "લોડ થઈ રહ્યું છે...",
  no_assigned: "આ લોકેશન પર કોઈ કામ બાકી નથી",
  others_label: "અન્ય / અલગ લોકેશન",
  other_villages_label: "અન્ય ગામના ખેડૂતો",
  village_all: "બધા ગામ",
  pending_sample: "સેમ્પલ બાકી",
};

export default function SampleTab({
  location,
  selectedVillage,
  initialData, // Added to accept props if needed, or keep internal load
}: {
  location: string;
  selectedVillage: string;
  initialData?: SampleTabItem[];
}) {
  const router = useRouter();
  // Initialize with props if available, else empty array
  const [data, setData] = useState<SampleTabItem[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);

  // Search State
  const [localSearch, setLocalSearch] = useState("");

  // Accordion States
  const [isOthersOpen, setIsOthersOpen] = useState(false);
  const [isVillageHiddenOpen, setIsVillageHiddenOpen] = useState(false);

  // Load Data Function
  const load = useCallback(async () => {
    // If we already have initialData, we might not need to fetch immediately, 
    // but for refresh actions we do.
    setLoading(true);
    try {
      const res: unknown = await getPendingSamples();
      setData(res as SampleTabItem[]); 
    } catch (error) {
      toast.error("Error loading samples");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Fetch only if no initialData provided
  useEffect(() => {
    if (!initialData) {
      load();
    }
  }, [initialData, load]);

  const handleTabAction = async (item: SampleTabItem) => {
    if (item.status === "Harvested") {
      await markSampleReceived(item.crop_cycle_id);
      load(); 
    } else if (item.status === "Sample Collected") {
      router.push(`/employee/sample/${item.crop_cycle_id}`);
    }
  };

  // --- FILTERING LOGIC ---
  const searchFiltered = data.filter((item) => {
    if (!localSearch) return true;
    const term = localSearch.toLowerCase();
    return (
      item.farmer_name.toLowerCase().includes(term) ||
      (item.village_name || "").toLowerCase().includes(term)
    );
  });

  const isLocationMatch = (itemLoc: string | null) => {
    const current = location.toLowerCase().replace(" yard", "").trim();
    const item = (itemLoc || "Farm").toLowerCase().replace(" yard", "").trim();
    return item.includes(current);
  };

  const assignedPool = searchFiltered.filter((item) => {
    return isLocationMatch(item.collection_loc) && item.is_assigned;
  });

  const otherList = searchFiltered.filter((item) => {
    return !(isLocationMatch(item.collection_loc) && item.is_assigned);
  });

  const { displayedList, hiddenVillageList } = useMemo(() => {
    if (selectedVillage === "All") {
      return { displayedList: assignedPool, hiddenVillageList: [] };
    }
    const visible = [];
    const hidden = [];
    for (const item of assignedPool) {
      if (item.village_name === selectedVillage) {
        visible.push(item);
      } else {
        hidden.push(item);
      }
    }
    return { displayedList: visible, hiddenVillageList: hidden };
  }, [assignedPool, selectedVillage]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <LoaderCircle className="w-8 h-8 animate-spin mb-2 text-slate-500" />
        <p className="text-xs font-medium text-slate-400">
          {LOCAL_TXT.loading}
        </p>
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={LOCAL_TXT.search_placeholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-100 transition-shadow"
        />
      </div>

      {displayedList.length > 0 ? (
        displayedList.map((item) => (
          <UniversalCard
            key={item.crop_cycle_id}
            data={item}
            location={location}
            onAction={() => handleTabAction(item)}
          />
        ))
      ) : (
        <div className="py-8 text-center opacity-50 border-2 border-dashed border-slate-100 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {selectedVillage !== "All"
              ? `${selectedVillage} માં કોઈ સેમ્પલ નથી`
              : LOCAL_TXT.no_assigned}
          </p>
        </div>
      )}

      {hiddenVillageList.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setIsVillageHiddenOpen(!isVillageHiddenOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl active:scale-[0.98] transition-transform"
          >
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" />
              {LOCAL_TXT.other_villages_label} ({hiddenVillageList.length})
            </span>
            {isVillageHiddenOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isVillageHiddenOpen && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {hiddenVillageList.map((item) => (
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

      {otherList.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setIsOthersOpen(!isOthersOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 rounded-xl text-slate-600 border border-slate-200 active:scale-[0.98] transition-transform"
          >
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {LOCAL_TXT.others_label} ({otherList.length})
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