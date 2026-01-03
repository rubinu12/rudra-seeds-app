"use client";

import { useState, useEffect, useActionState } from "react";
import { toast } from "sonner";
import { Scale, Lock, CheckCircle2, AlertTriangle, MapPin, SearchX, Phone, ChevronDown, ChevronUp, AlertCircle, Search } from "lucide-react";
import { getPendingWeighing, submitWeighing } from "@/app/employee-v2/actions/weigh";
import { GUJARATI } from "@/app/employee-v2/translations";

// --- Types ---
type WeighingItem = {
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

// --- Helper Text ---
const LOCAL_TXT = {
    verify: "ચકાસો", // Verify
    lot_mismatch: "લોટ નંબર ખોટો છે", // Lot Number Incorrect
    lot_verified: "લોટ નંબર સાચો છે", // Lot Number Verified
    enter_lot: "ટેગ મુજબ લોટ નં નાખો", // Enter Lot No as per Tag
    total_bags: "કુલ ગુણી (વજન)", // Total Bags (Weight)
    confirm_bags: "ફરીથી લખો (Confirm)", // Write Again
    mismatch: "આંકડા મેચ થતા નથી", // Numbers don't match
    save: "સેવ કરો", // Save
    cancel: "બંધ કરો", // Close/Cancel
    warning: "ચેતવણી: વજન વધારે છે", // Warning: Weight is high
    processing: "સેવ થાય છે...", // Saving...
    weighed_success: "વજન સેવ થઈ ગયું!", // Saved successfully
    pending_badge: "વજન બાકી", // Weight Pending
    lot_label: "વીણેલો લોટ નં", // Selected Lot No
    others_label: "અન્ય / અલગ લોકેશન", // Other / Different Location
    no_assigned: "આ લોકેશન પર કોઈ કામ બાકી નથી", // No assigned work at this location
};

export default function WeighingTab({ collectionFilter }: { collectionFilter: string }) {
    const [data, setData] = useState<WeighingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    
    // New State for "Others" logic matching SampleTab
    const [localSearch, setLocalSearch] = useState("");
    const [isOthersOpen, setIsOthersOpen] = useState(false);

    // Load Data
    useEffect(() => {
        async function load() {
            try {
                const list = await getPendingWeighing();
                setData(list as unknown as WeighingItem[]);
            } catch (e) {
                toast.error("ડેટા લાવવામાં ભૂલ થઈ છે");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSuccess = (id: number) => {
        setExpandedId(null);
        setData(prev => prev.filter(item => item.crop_cycle_id !== id));
        toast.success(LOCAL_TXT.weighed_success);
    };

    // --- FILTERING LOGIC (Matching SampleTab) ---

    // 1. Local Search Filter
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
        // Normalize strings (remove 'yard', trim, lowercase) to match widely
        const current = collectionFilter.toLowerCase().replace(" yard", "").trim();
        const item = (itemLoc || "Farm").toLowerCase().replace(" yard", "").trim();
        return item.includes(current);
    };

    // 3. Split into "My List" vs "Others"
    const assignedList = searchFiltered.filter((item) => {
        const locationMatches = isLocationMatch(item.collection_loc);
        return locationMatches && item.is_assigned; // Must match BOTH Location AND Assignment
    });

    const otherList = searchFiltered.filter((item) => {
        const locationMatches = isLocationMatch(item.collection_loc);
        return !(locationMatches && item.is_assigned); // Everything else (Wrong location OR Not assigned)
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <Scale className="w-8 h-8 animate-pulse mb-2 text-slate-500" />
            <p className="text-xs font-medium text-slate-400">{GUJARATI.search_placeholder}</p>
        </div>
    );

    return (
        <div className="space-y-4 pb-24 animate-in fade-in duration-300">
            {/* Local Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Filter list..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                />
            </div>

            {/* PRIMARY LIST (Matches Location + Assigned) */}
            {assignedList.length > 0 ? (
                assignedList.map((item) => (
                    <ExpandableCard 
                        key={item.crop_cycle_id} 
                        item={item} 
                        isExpanded={expandedId === item.crop_cycle_id}
                        onToggle={() => setExpandedId(expandedId === item.crop_cycle_id ? null : item.crop_cycle_id)}
                        onSuccess={() => handleSuccess(item.crop_cycle_id)}
                    />
                ))
            ) : (
                <div className="py-8 text-center opacity-50">
                     <SearchX className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {LOCAL_TXT.no_assigned}
                    </p>
                </div>
            )}

            {/* OTHERS LIST (Accordion for items that don't match filter) */}
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
                                    onToggle={() => setExpandedId(expandedId === item.crop_cycle_id ? null : item.crop_cycle_id)}
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

// --- The Expandable Card Component (Unchanged Logic, just ensuring it's included) ---

function ExpandableCard({ 
    item, 
    isExpanded, 
    onToggle,
    onSuccess 
}: { 
    item: WeighingItem, 
    isExpanded: boolean, 
    onToggle: () => void,
    onSuccess: () => void
}) {
    // Form State
    const [lotInput, setLotInput] = useState("");
    const [isLotVerified, setIsLotVerified] = useState(false);
    const [bagsInput, setBagsInput] = useState("");
    const [confirmBagsInput, setConfirmBagsInput] = useState("");

    // Reset form when closed
    useEffect(() => {
        if (!isExpanded) {
            setLotInput("");
            setIsLotVerified(false);
            setBagsInput("");
            setConfirmBagsInput("");
        }
    }, [isExpanded]);

    // Derived Logic
    const maxYield = ((item.seed_bags_purchased || 0) - (item.seed_bags_returned || 0)) * 50;
    const isHighYield = Number(bagsInput) > maxYield && maxYield > 0;
    const bagsMatch = bagsInput === confirmBagsInput && bagsInput !== "";

    // Server Action
    const [state, formAction, isPending] = useActionState(submitWeighing, null);

    // Watch for success
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
        <div className={`bg-white rounded-[24px] shadow-sm border transition-all duration-300 overflow-hidden relative
            ${isExpanded ? "border-purple-500 ring-1 ring-purple-100 shadow-lg" : "border-slate-100"}`}>
            
            {/* Header */}
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
                        {/* Assignment Badge for clarity in "Others" list */}
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

            {/* Form */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="h-px w-full bg-slate-100 mb-4" /> 

                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="cropCycleId" value={item.crop_cycle_id} />
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
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{LOCAL_TXT.lot_label}</p>
                                        <p className="text-lg font-mono font-bold text-green-800 tracking-widest">{lotInput}</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => { setIsLotVerified(false); setLotInput(""); }}
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
                                        <p>{LOCAL_TXT.warning} ({maxYield} Max)</p>
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
                                                ${confirmBagsInput && !bagsMatch 
                                                    ? "border-red-300 bg-red-50" 
                                                    : "border-slate-300 focus:ring-2 focus:ring-purple-500"}`}
                                        />
                                    </div>
                                </div>
                                
                                {confirmBagsInput && !bagsMatch && (
                                    <p className="text-xs text-red-500 font-medium text-center">{LOCAL_TXT.mismatch}</p>
                                )}

                                <button 
                                    type="submit"
                                    disabled={!bagsMatch || isPending || bagsInput === "0"} 
                                    className="w-full py-3.5 mt-2 text-white font-bold bg-purple-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? LOCAL_TXT.processing : GUJARATI.btn_start_weighing}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}