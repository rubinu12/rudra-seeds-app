"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Scale,
  Lock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  SearchX,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Search,
  Users,
  LoaderCircle,
  Loader2,
  Save
} from "lucide-react";
import {
  getPendingWeighing,
  getCycleLots,
  submitWeighing,
  WeighingItem,
  CycleLotOption
} from "@/src/app/employee/actions/weigh";
import { GUJARATI } from "@/src/app/employee/translations";

const LOCAL_TXT = {
  // Legacy Keys
  verify: "ચકાસો",
  lot_mismatch: "લોટ નંબર ખોટો છે",
  lot_verified: "લોટ નંબર સાચો છે",
  enter_lot: "ટેગ મુજબ લોટ નં નાખો",
  total_bags: "કુલ ગુણી (વજન)",
  confirm_bags: "કુલ વજન (Confirm)", 
  mismatch: "તમારો સરવાળો મેચ થતો નથી (Sum Mismatch)",
  save: "સેવ કરો",
  cancel: "બંધ કરો",
  warning: "ચેતવણી: વજન વધારે છે",
  processing: "સેવ થાય છે...",
  weighed_success: "વજન સેવ થઈ ગયું!",
  pending_badge: "વજન બાકી",
  lot_label: "વીણેલો લોટ નં",
  others_label: "અન્ય / અલગ લોકેશન",
  other_villages_label: "અન્ય ગામના ખેડૂતો",
  no_assigned: "આ લોકેશન પર કોઈ કામ બાકી નથી",
  search_placeholder: "ખેડૂતનું નામ શોધો...",
  loading: "લોડ થઈ રહ્યું છે...",
  
  // New Keys for Multi-Lot
  fetch_lots: "લોટની વિગતો લાવી રહ્યા છીએ...",
  enter_bags_per_lot: "દરેક લોટ મુજબ ગુણી નાખો:",
};

export default function WeighingTab({
  collectionFilter,
  selectedVillage,
  initialData, 
}: {
  collectionFilter: string;
  selectedVillage: string;
  initialData?: WeighingItem[];
}) {
  const [data, setData] = useState<WeighingItem[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filters & State
  const [localSearch, setLocalSearch] = useState("");
  const [isOthersOpen, setIsOthersOpen] = useState(false);
  const [isVillageHiddenOpen, setIsVillageHiddenOpen] = useState(false);

  // Load Data
  useEffect(() => {
    if (!initialData) {
        async function load() {
        try {
            const list = await getPendingWeighing();
            setData(list);
        } catch (error) {
            toast.error("ડેટા લાવવામાં ભૂલ થઈ છે");
        } finally {
            setLoading(false);
        }
        }
        load();
    }
  }, [initialData]);

  const handleSuccess = (id: number) => {
    setExpandedId(null);
    setData((prev) => prev.filter((item) => item.crop_cycle_id !== id));
    toast.success(LOCAL_TXT.weighed_success);
  };

  // --- FILTERING LOGIC (Restored from Legacy) ---
  
  // 1. Local Search Filter
  const searchFiltered = data.filter((item) => {
    if (!localSearch) return true;
    const term = localSearch.toLowerCase();
    return (
      item.farmer_name?.toLowerCase().includes(term) ||
      item.village_name?.toLowerCase().includes(term)
    );
  });

  // 2. Helper: Check Location Match (Soft Filter)
  const isLocationMatch = (itemLoc: string | null) => {
    const current = collectionFilter.toLowerCase().replace(" yard", "").trim();
    const item = (itemLoc || "Farm").toLowerCase().replace(" yard", "").trim();
    return item.includes(current);
  };

  // 3. Split into "Assigned Pool" vs "Other List"
  // Assigned Pool: Matches Location AND User is Assigned
  const assignedPool = searchFiltered.filter((item) => {
    return isLocationMatch(item.collection_loc) && item.is_assigned;
  });

  // Other List: Wrong Location OR Not Assigned
  const otherList = searchFiltered.filter((item) => {
    return !(isLocationMatch(item.collection_loc) && item.is_assigned);
  });

  // 4. Split Assigned Pool by Village
  const { displayedList, hiddenVillageList } = useMemo(() => {
    if (selectedVillage === "All") {
      return { displayedList: assignedPool, hiddenVillageList: [] };
    }
    const visible: WeighingItem[] = [];
    const hidden: WeighingItem[] = [];
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
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={LOCAL_TXT.search_placeholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-100 transition-all"
        />
      </div>

      {displayedList.length > 0 ? (
        displayedList.map((item) => (
          <ExpandableCard
            key={item.crop_cycle_id}
            item={item}
            isExpanded={expandedId === item.crop_cycle_id}
            onToggle={() =>
              setExpandedId(
                expandedId === item.crop_cycle_id ? null : item.crop_cycle_id,
              )
            }
            onSuccess={() => handleSuccess(item.crop_cycle_id)}
          />
        ))
      ) : (
        <div className="py-8 text-center opacity-50">
          <SearchX className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {selectedVillage !== "All"
              ? `${selectedVillage} માં કોઈ વજન બાકી નથી`
              : LOCAL_TXT.no_assigned}
          </p>
        </div>
      )}

      {/* Hidden Villages Dropdown */}
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
                <ExpandableCard
                  key={item.crop_cycle_id}
                  item={item}
                  isExpanded={expandedId === item.crop_cycle_id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === item.crop_cycle_id ? null : item.crop_cycle_id,
                    )
                  }
                  onSuccess={() => handleSuccess(item.crop_cycle_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Others Dropdown (Soft Filtered Items) */}
      {otherList.length > 0 && (
        <div className="pt-4">
          <button
            onClick={() => setIsOthersOpen(!isOthersOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 rounded-xl text-slate-600 border border-slate-200 active:scale-[0.99] transition-transform"
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
                <ExpandableCard
                  key={item.crop_cycle_id}
                  item={item}
                  isExpanded={expandedId === item.crop_cycle_id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === item.crop_cycle_id ? null : item.crop_cycle_id,
                    )
                  }
                  onSuccess={() => handleSuccess(item.crop_cycle_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- CARD COMPONENT (Multi-Lot Enabled) ---
function ExpandableCard({
  item,
  isExpanded,
  onToggle,
  onSuccess,
}: {
  item: WeighingItem;
  isExpanded: boolean;
  onToggle: () => void;
  onSuccess: () => void;
}) {
  const [lots, setLots] = useState<CycleLotOption[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [confirmTotalInput, setConfirmTotalInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchLots();
    } else {
      setInputs({});
      setConfirmTotalInput("");
    }
  }, [isExpanded]);

  const fetchLots = async () => {
    setLoadingLots(true);
    try {
        const data = await getCycleLots(item.crop_cycle_id);
        setLots(data);
        const initial: Record<number, string> = {};
        data.forEach(l => {
            if(l.current_weight > 0) initial[l.lot_id] = String(l.current_weight);
        });
        setInputs(initial);
    } catch(e) {
        toast.error("Failed to load lots");
    } finally {
        setLoadingLots(false);
    }
  };

  const handleWeightChange = (lotId: number, val: string) => {
    setInputs(prev => ({ ...prev, [lotId]: val }));
  };

  const calculatedSum = lots.reduce((acc, lot) => {
    return acc + (parseFloat(inputs[lot.lot_id] || "0") || 0);
  }, 0);

  const userTotal = parseFloat(confirmTotalInput) || 0;
  const isMatch = userTotal === calculatedSum && confirmTotalInput !== "";

  // Yield Logic
  const maxYield = ((item.seed_bags_purchased || 0) - (item.seed_bags_returned || 0)) * 50;
  const isHighYield = calculatedSum > maxYield && maxYield > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
        toast.error(LOCAL_TXT.mismatch);
        return;
    }

    setIsSubmitting(true);
    const payload = lots.map(lot => ({
        lot_id: lot.lot_id,
        weight: parseFloat(inputs[lot.lot_id] || "0")
    }));

    const res = await submitWeighing(item.crop_cycle_id, payload, "");
    setIsSubmitting(false);

    if (res.success) {
        onSuccess();
    } else {
        toast.error(res.message || "Failed");
    }
  };

  return (
    <div
      className={`bg-white rounded-[24px] shadow-sm border transition-all duration-300 overflow-hidden relative
            ${
              isExpanded
                ? "border-purple-500 ring-1 ring-purple-100 shadow-lg"
                : "border-slate-100"
            }`}
    >
      <div
        onClick={onToggle}
        className="p-5 flex justify-between items-start cursor-pointer active:bg-slate-50 relative z-10"
      >
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            {item.farmer_name}
          </h3>
          <div className="flex items-center gap-1 text-sm text-slate-400 font-medium mt-1">
            <span>{item.village_name}</span>
            {item.landmark_name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {item.landmark_name}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
              {item.seed_variety}
            </span>
            {!isExpanded && (
              <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {LOCAL_TXT.pending_badge}
              </span>
            )}
            
            {/* Display Aggregated Lots Badge */}
            {item.lot_no && item.lot_no !== "No Lot" && (
                <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                    {item.lot_no}
                </span>
            )}
          </div>
        </div>

        <a
          href={`tel:${item.mobile_number}`}
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="h-px w-full bg-slate-100 mb-4" />
          
          {loadingLots ? (
             <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">{LOCAL_TXT.fetch_lots}</span>
             </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-4">
                
                {isHighYield && (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-2 text-orange-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p>{LOCAL_TXT.warning} ({maxYield} Max)</p>
                  </div>
                )}

                {/* Multi-Lot Inputs */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {LOCAL_TXT.enter_bags_per_lot}
                    </label>
                    {lots.map(lot => (
                        <div key={lot.lot_id} className="flex items-center gap-3">
                            <div className="w-24 bg-slate-100 rounded-lg p-3 text-xs font-bold text-slate-600 text-center border border-slate-200">
                                {lot.lot_number || "Lot #"}
                            </div>
                            <input
                                type="number"
                                value={inputs[lot.lot_id] || ""}
                                onChange={(e) => handleWeightChange(lot.lot_id, e.target.value)}
                                placeholder="0"
                                className="flex-1 p-3 text-lg font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    ))}
                </div>

                {/* Security Check */}
                <div className="space-y-1 relative pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {LOCAL_TXT.confirm_bags}
                    </label>
                    <input
                      type="password"
                      value={confirmTotalInput}
                      onChange={(e) => setConfirmTotalInput(e.target.value)}
                      placeholder="***"
                      className={`w-full p-3 text-lg font-bold border rounded-xl outline-none transition-all
                            ${confirmTotalInput && !isMatch
                                ? "border-red-300 bg-red-50"
                                : "border-slate-300 focus:ring-2 focus:ring-purple-500"
                            }`}
                    />
                </div>

                {confirmTotalInput && !isMatch && (
                  <p className="text-xs text-red-500 font-medium text-center">
                    {LOCAL_TXT.mismatch}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!isMatch || isSubmitting || calculatedSum === 0}
                  className="w-full py-3.5 mt-2 text-white font-bold bg-purple-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                     <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {LOCAL_TXT.processing}
                     </>
                  ) : (
                     <>
                        <Save className="w-4 h-4" />
                        {GUJARATI.btn_start_weighing}
                     </>
                  )}
                </button>
             </form>
          )}
        </div>
      )}
    </div>
  );
}