"use client";

import { useState, useEffect, useActionState, useMemo } from "react";
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
} from "lucide-react";
import {
  getPendingWeighing,
  submitWeighing,
} from "@/src/app/employee/actions/weigh";
import { GUJARATI } from "@/src/app/employee/translations";

// --- EXPORTED TYPE (For DashboardClient) ---
export type WeighingItem = {
  crop_cycle_id: number;
  farmer_name: string;
  mobile_number: string;
  village_name: string;
  landmark_name: string;
  seed_variety: string;
  color_code?: string;
  status: string;
  lot_no: string;
  collection_loc: string;
  is_assigned: boolean;
  seed_bags_purchased?: number;
  seed_bags_returned?: number;
};

const LOCAL_TXT = {
  verify: "ચકાસો",
  lot_mismatch: "લોટ નંબર ખોટો છે",
  lot_verified: "લોટ નંબર સાચો છે",
  enter_lot: "ટેગ મુજબ લોટ નં નાખો",
  total_bags: "કુલ ગુણી (વજન)",
  confirm_bags: "ફરીથી લખો (Confirm)",
  mismatch: "આંકડા મેચ થતા નથી",
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
};

export default function WeighingTab({
  collectionFilter,
  selectedVillage,
  initialData, // Accept Props
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
            const list: unknown = await getPendingWeighing();
            setData(list as WeighingItem[]);
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

  // --- FILTERING LOGIC ---
  const searchFiltered = data.filter((item) => {
    if (!localSearch) return true;
    const term = localSearch.toLowerCase();
    return (
      item.farmer_name?.toLowerCase().includes(term) ||
      item.village_name?.toLowerCase().includes(term)
    );
  });

  const isLocationMatch = (itemLoc: string | null) => {
    const current = collectionFilter.toLowerCase().replace(" yard", "").trim();
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
                      expandedId === item.crop_cycle_id
                        ? null
                        : item.crop_cycle_id,
                    )
                  }
                  onSuccess={() => handleSuccess(item.crop_cycle_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
                      expandedId === item.crop_cycle_id
                        ? null
                        : item.crop_cycle_id,
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
  const [lotInput, setLotInput] = useState("");
  const [isLotVerified, setIsLotVerified] = useState(false);
  const [bagsInput, setBagsInput] = useState("");
  const [confirmBagsInput, setConfirmBagsInput] = useState("");

  useEffect(() => {
    if (!isExpanded) {
      setLotInput("");
      setIsLotVerified(false);
      setBagsInput("");
      setConfirmBagsInput("");
    }
  }, [isExpanded]);

  const maxYield =
    ((item.seed_bags_purchased || 0) - (item.seed_bags_returned || 0)) * 50;
  const isHighYield = Number(bagsInput) > maxYield && maxYield > 0;
  const bagsMatch = bagsInput === confirmBagsInput && bagsInput !== "";

  const [state, formAction, isPending] = useActionState(submitWeighing, null);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const handleVerifyLot = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!lotInput) {
      toast.error("કૃપા કરીને લોટ નંબર નાખો");
      return;
    }
    const dbLot = item.lot_no || "TEST";
    if (lotInput.trim().toUpperCase() === dbLot.trim().toUpperCase()) {
      setIsLotVerified(true);
      toast.success(LOCAL_TXT.lot_verified);
    } else {
      toast.error(`${LOCAL_TXT.lot_mismatch}`);
      setLotInput("");
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
          <div className="flex gap-2 mt-3">
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
              {item.seed_variety}
            </span>
            {!isExpanded && (
              <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {LOCAL_TXT.pending_badge}
              </span>
            )}
            {!item.is_assigned && (
              <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold">
                Not Assigned
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

          <form action={formAction} className="space-y-4">
            <input
              type="hidden"
              name="cropCycleId"
              value={item.crop_cycle_id}
            />
            <input type="hidden" name="lotNo" value={lotInput} />

            {!isLotVerified ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {GUJARATI.lot_no}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lotInput}
                    onChange={(e) => setLotInput(e.target.value)}
                    placeholder={LOCAL_TXT.enter_lot}
                    className="flex-1 p-3 border border-slate-300 rounded-xl font-mono uppercase tracking-wider outline-none text-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyLot}
                    className="bg-slate-900 text-white px-5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                  >
                    {LOCAL_TXT.verify}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                      {LOCAL_TXT.lot_label}
                    </p>
                    <p className="text-lg font-mono font-bold text-green-800 tracking-widest">
                      {lotInput}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsLotVerified(false);
                    setLotInput("");
                  }}
                  className="text-xs font-medium text-slate-400 underline hover:text-slate-600"
                >
                  Change
                </button>
              </div>
            )}

            {isLotVerified && (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                {isHighYield && (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-2 text-orange-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p>
                      {LOCAL_TXT.warning} ({maxYield} Max)
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {GUJARATI.bags}
                    </label>
                    <input
                      type="number"
                      name="bags"
                      value={bagsInput}
                      onChange={(e) => setBagsInput(e.target.value)}
                      placeholder="0"
                      className="w-full p-3 text-lg font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {LOCAL_TXT.confirm_bags}
                    </label>
                    <input
                      type="password"
                      value={confirmBagsInput}
                      onChange={(e) => setConfirmBagsInput(e.target.value)}
                      placeholder="***"
                      className={`w-full p-3 text-lg font-bold border rounded-xl outline-none transition-all
                                                ${
                                                  confirmBagsInput && !bagsMatch
                                                    ? "border-red-300 bg-red-50"
                                                    : "border-slate-300 focus:ring-2 focus:ring-purple-500"
                                                }`}
                    />
                  </div>
                </div>

                {confirmBagsInput && !bagsMatch && (
                  <p className="text-xs text-red-500 font-medium text-center">
                    {LOCAL_TXT.mismatch}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!bagsMatch || isPending || bagsInput === "0"}
                  className="w-full py-3.5 mt-2 text-white font-bold bg-purple-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isPending
                    ? LOCAL_TXT.processing
                    : GUJARATI.btn_start_weighing}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}