"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  PackagePlus,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp, // For Manifest Drawer
  Info,
  Scale,
  MapPin,
  RotateCcw, // Undo Icon
  LoaderCircle,
  Filter,
  Check,
  Trash2,    // Delete Icon
  List,      // Manifest Icon
  Truck,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getShipmentById,
  getFarmersForLoading,
  getActiveShipments,
  addBagsToShipment,
  markShipmentAsFilled,
  undoLastLoad,
  getAllVillages,
  getShipmentManifest, // New Import
  removeShipmentItem,  // New Import
  ActiveShipment,
  FarmerStock,
} from "@/src/app/employee/actions/shipments";

// --- TYPES ---
type ManifestItem = {
  item_id: number;
  bags_loaded: number;
  added_at: string;
  farmer_name: string;
  village_name: string;
  variety_name: string;
  color_code: string;
  crop_cycle_id: number;
};

// --- CONSTANTS & TRANSLATIONS ---
const LOCATIONS = ["Parabadi yard", "Dhoraji yard", "Jalasar yard", "Farm"];

const TXT = {
  loading: "લોડ થાય છે...",
  switch_truck: "ટ્રક બદલો",
  rem: "બાકી",
  my_loc: "મારું લોકેશન",
  village_all: "બધા",
  village_select: "ગામ પસંદ કરો",
  search_village: "ગામ શોધો...",
  no_village: "કોઈ ગામ નથી",
  search_farmer: "ખેડૂતનું નામ...",
  ready_load: "તૈયાર",
  at: "ખાતે",
  other_variety: "અન્ય વેરાયટી",
  other_loc: "અન્ય લોકેશન",
  bags: "ગુણી",
  avail: "હાજર",
  force_load: "ફોર્સ લોડ",
  load_bags: "ભરો",
  saving: "સેવ...",
  undo: "Undo",
  confirm: "Confirm",
  success: "સફળ",
  overfilled: "વધુ ભરાયેલ",
  underfilled: "ઓછું ભરાયેલ",
  ready: "રેડી",
  error_limit: "ખેડૂત પાસે સ્ટોક નથી!",
  error_truck_full: "ટ્રક ફૂલ છે!",
  toast_loaded: "લોડ થઈ ગયું!",
  toast_confirmed: "ટ્રક કન્ફર્મ થઈ!",
  alert_confirm: "ટ્રક લોક કરવી છે?",
  warn_mismatch: "વેરાયટી અલગ છે",
  warn_loc_mismatch: "લોકેશન અલગ છે",
  truck_expects: "ટ્રક માંગે છે:",
  manifest: "ભરેલ માલ", // Manifest
  empty_manifest: "હજુ સુધી કંઈ ભર્યું નથી", // Empty
  remove: "કાઢો", // Remove
  total_loaded: "કુલ ભરેલ", // Total Loaded
  item_removed: "ગુણી કાઢી નાખી", // Item Removed
  space_left: "જગ્યા બાકી", // Space Left
};

const LOC_DISPLAY: Record<string, string> = {
  "Parabadi yard": "પરબડી",
  "Dhoraji yard": "ધોરાજી",
  "Jalasar yard": "જલારામ",
  Farm: "ફાર્મ",
};

const VILLAGE_CACHE_KEY = "rudra_villages_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function ShipmentDetailsPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();

  // --- DATA STATE ---
  const [shipment, setShipment] = useState<ActiveShipment | null>(null);
  const [farmers, setFarmers] = useState<FarmerStock[]>([]);
  const [manifest, setManifest] = useState<ManifestItem[]>([]); 
  const [otherShipments, setOtherShipments] = useState<ActiveShipment[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [allVillages, setAllVillages] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- UI FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("All");

  // --- VISIBILITY STATE ---
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);
  const [showTruckSwitcher, setShowTruckSwitcher] = useState(false);
  const [showVarietyMismatch, setShowVarietyMismatch] = useState(false);
  const [showLocationMismatch, setShowLocationMismatch] = useState(false);
  const [showManifest, setShowManifest] = useState(false); // Controls the Drawer
  const [villageSearch, setVillageSearch] = useState("");

  // --- LAST ACTION STATE (For Feedback Strip) ---
  const [lastAction, setLastAction] = useState<{
    cycleId: number;
    qty: number;
    name: string;
    variety: string; // Saved to display in feedback
  } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (id) {
      loadData();
      loadVillages();
    }
  }, [id]);

  const loadVillages = async () => {
    const now = Date.now();
    const cached = localStorage.getItem(VILLAGE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < CACHE_DURATION) {
        setAllVillages(parsed.data);
        getAllVillages().then((fresh) => {
          if (JSON.stringify(fresh) !== JSON.stringify(parsed.data)) {
            setAllVillages(fresh);
            localStorage.setItem(VILLAGE_CACHE_KEY, JSON.stringify({ timestamp: now, data: fresh }));
          }
        });
        return;
      }
    }
    const freshData = await getAllVillages();
    setAllVillages(freshData);
    localStorage.setItem(VILLAGE_CACHE_KEY, JSON.stringify({ timestamp: now, data: freshData }));
  };

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const [sData, fData, allShipments, manifestData] = await Promise.all([
        getShipmentById(id),
        getFarmersForLoading(),
        getActiveShipments(),
        getShipmentManifest(id), // Load Manifest Rows
      ]);
      setShipment(sData);
      setFarmers(fData);
      setManifest(manifestData as ManifestItem[]);
      setOtherShipments(allShipments.filter((s) => s.shipment_id !== id));
      if (sData && !currentLocation) {
        setCurrentLocation(sData.location || "Parabadi yard");
      }
    } catch (error) {
      toast.error("Error loading data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- FILTERS ---
  const checkLocation = (farmerLoc: string | null, targetLoc: string) => {
    const t = (targetLoc || "").toLowerCase().replace(" yard", "").trim();
    const f = (farmerLoc || "Farm").toLowerCase().replace(" yard", "").trim();
    return f.includes(t);
  };

  const farmersAtLocation = useMemo(
    () => farmers.filter((f) => checkLocation(f.collection_loc, currentLocation)),
    [farmers, currentLocation]
  );

  const locationMismatches = useMemo(
    () => farmers.filter((f) => !checkLocation(f.collection_loc, currentLocation)),
    [farmers, currentLocation]
  );

  const villageOptions = useMemo(() => ["All", ...allVillages], [allVillages]);

  const displayedFarmers = useMemo(() => {
    return farmersAtLocation.filter((f) => {
      if (selectedVillage !== "All" && f.village_name !== selectedVillage) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return f.farmer_name.toLowerCase().includes(lower) || f.village_name.toLowerCase().includes(lower);
      }
      return true;
    });
  }, [farmersAtLocation, selectedVillage, searchTerm]);

  const { bestMatches, varietyMismatches } = useMemo(() => {
    const best: FarmerStock[] = [];
    const mismatch: FarmerStock[] = [];
    const allowed = shipment?.allowed_seed_ids || [];
    displayedFarmers.forEach((f) => {
      if (allowed.includes(f.seed_id)) best.push(f);
      else mismatch.push(f);
    });
    return { bestMatches: best, varietyMismatches: mismatch };
  }, [displayedFarmers, shipment]);

  // --- ACTIONS ---

  // 1. Confirm Shipment
  const handleMarkFilled = async () => {
    if (!shipment) return;
    if (!window.confirm(TXT.alert_confirm)) return;
    setIsConfirming(true);
    const res = await markShipmentAsFilled(shipment.shipment_id);
    if (res.success) {
      toast.success(TXT.toast_confirmed);
      router.push("/employee/dashboard");
    } else {
      toast.error(res.message);
      setIsConfirming(false);
    }
  };

  // 2. Remove Item (Manifest Drawer)
  const handleRemoveItem = async (item: ManifestItem) => {
    if(!window.confirm(`${TXT.remove} ${item.bags_loaded} ${TXT.bags} - ${item.farmer_name}?`)) return;
    
    setIsUndoing(true);
    const res = await removeShipmentItem(item.item_id, id, item.crop_cycle_id, item.bags_loaded);
    
    if(res.success) {
        toast.success(TXT.item_removed);
        await loadData(true); // Refresh data
    } else {
        toast.error("Failed to remove");
    }
    setIsUndoing(false);
  };

  // 3. Quick Undo (Feedback Strip)
  const handleUndoClick = async () => {
    if (!shipment || !lastAction) return;
    setIsUndoing(true);
    const res = await undoLastLoad(
      shipment.shipment_id,
      lastAction.cycleId,
      lastAction.qty,
    );
    if (res.success) {
      toast.success(`${TXT.undo} ${TXT.success}`);
      setLastAction(null);
      await loadData(true);
    } else {
      toast.error("Undo Failed");
    }
    setIsUndoing(false);
  };

  // --- HELPERS ---
  const getStatusInfo = (current: number, target: number) => {
    const diff = current - target;
    if (diff > 50)
      return { bg: "bg-red-50", text: "text-red-600", bar: "bg-red-500", msg: TXT.overfilled, canConfirm: false };
    if (diff < -50)
      return { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500", msg: TXT.underfilled, canConfirm: false };
    return { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-600", msg: TXT.ready, canConfirm: true };
  };

  if (loading || !shipment)
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 gap-2 flex-col">
        <Scale className="w-8 h-8 animate-pulse text-slate-300" /> 
        <span className="text-sm font-bold tracking-widest uppercase">{TXT.loading}</span>
      </div>
    );

  const status = getStatusInfo(shipment.total_bags, shipment.target_bag_capacity);
  const remainingSpace = shipment.target_bag_capacity - shipment.total_bags;

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all duration-300">
        
        {/* ROW 1: CONTROLS */}
        <div className="px-3 py-3 flex items-center gap-2 relative">
          
          <button onClick={() => router.back()} className="p-2 -ml-1 rounded-full hover:bg-slate-100 shrink-0 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* TRUCK SWITCHER */}
          <div className="flex-1 min-w-0 cursor-pointer relative group" onClick={() => setShowTruckSwitcher(!showTruckSwitcher)}>
            <div className="flex items-baseline gap-1.5">
              <h1 className="font-black text-lg text-slate-900 leading-none truncate tracking-tight">{shipment.vehicle_number}</h1>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showTruckSwitcher ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase truncate leading-tight">{shipment.company_name}</p>
            
            {showTruckSwitcher && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setShowTruckSwitcher(false); }} />
                <div className="absolute top-12 left-0 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-[101] max-h-[60vh] overflow-y-auto animate-in fade-in zoom-in-95 origin-top-left">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 flex items-center gap-2">
                    <Truck className="w-3 h-3" /> {TXT.switch_truck}
                  </div>
                  {otherShipments.length === 0 ? <div className="p-4 text-center text-xs text-slate-400">No other trucks loading</div> : 
                    otherShipments.map((s) => (
                      <div key={s.shipment_id} onClick={(e) => { e.stopPropagation(); router.push(`/employee/shipment/${s.shipment_id}`); }} className="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer group/item transition-colors">
                        <div className="font-bold text-slate-800 text-sm group-hover/item:text-blue-700">{s.vehicle_number}</div>
                        <div className="text-[10px] text-slate-500">{s.company_name}</div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>

          {/* CONFIRM BUTTON */}
          {status.canConfirm && !isConfirming && (
             <button onClick={handleMarkFilled} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md active:scale-95 flex items-center gap-1.5 animate-in fade-in zoom-in-95 shrink-0 hover:bg-slate-800 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> {TXT.confirm}
             </button>
          )}

          {/* FILTERS */}
          <div className="flex items-center gap-1.5 shrink-0">
             <div className="relative">
              <button onClick={() => setShowLocationPicker(!showLocationPicker)} className={`flex items-center gap-1 h-9 px-3 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${showLocationPicker ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200"}`}>
                <MapPin className="w-3.5 h-3.5" /> <span className="max-w-[70px] truncate">{LOC_DISPLAY[currentLocation] || currentLocation}</span>
              </button>
              {showLocationPicker && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowLocationPicker(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-[101] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                    {LOCATIONS.map((loc) => (
                      <div key={loc} onClick={() => { setCurrentLocation(loc); setShowLocationPicker(false); }} className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer text-xs font-bold flex justify-between items-center ${currentLocation === loc ? "text-blue-600 bg-blue-50" : "text-slate-600"}`}>
                        <span>{LOC_DISPLAY[loc] || loc}</span> {currentLocation === loc && <Check className="w-3.5 h-3.5" />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {currentLocation === "Farm" && (
              <div className="relative">
                <button onClick={() => { setShowVillagePicker(!showVillagePicker); setVillageSearch(""); }} className={`flex items-center gap-1 h-9 px-3 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${selectedVillage !== "All" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200"}`}>
                  <Filter className="w-3.5 h-3.5" /> <span className="max-w-[80px] truncate">{selectedVillage === "All" ? TXT.village_all : selectedVillage}</span>
                </button>
                {showVillagePicker && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowVillagePicker(false)} />
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-[101] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                      <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input autoFocus value={villageSearch} onChange={(e) => setVillageSearch(e.target.value)} placeholder={TXT.search_village} className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500" />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {villageOptions.filter((v) => v.toLowerCase().includes(villageSearch.toLowerCase())).map((v) => (
                            <div key={v} onClick={() => { setSelectedVillage(v); setShowVillagePicker(false); }} className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer text-xs font-bold flex justify-between items-center ${selectedVillage === v ? "bg-purple-50 text-purple-700" : "text-slate-700"}`}>
                              <span>{v === "All" ? TXT.village_all : v}</span> {selectedVillage === v && <Check className="w-3.5 h-3.5" />}
                            </div>
                          ))}
                        {villageOptions.length === 0 && <div className="p-4 text-center text-[10px] text-slate-400 font-medium">{TXT.no_village}</div>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- ROW 2: PROGRESS & FEEDBACK STRIP (UPDATED) --- */}
        {!showManifest && (
            <div className="px-3 pb-3 animate-in slide-in-from-top-2 fade-in">
                <div className={`p-3 rounded-xl border ${status.bg} border-transparent relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[52px]`}>
                    
                    {/* Top Layer: Info & Controls */}
                    <div className="relative z-10 w-full flex justify-between items-start gap-2">
                        
                        {/* LEFT: Information Area */}
                        <div className="flex-1 min-w-0">
                            {lastAction ? (
                                // A. "SUCCESS" MODE (Green)
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-1.5 text-green-700 mb-0.5">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{TXT.success}</span>
                                    </div>
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <span className="font-black text-slate-900 text-sm">
                                            {lastAction.qty} {TXT.bags}
                                        </span>
                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">
                                            • {lastAction.name}
                                        </span>
                                        {/* Shows Variety now */}
                                        {lastAction.variety && (
                                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-white/40 px-1 rounded truncate">
                                                {lastAction.variety}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // B. "STATUS" MODE (Normal)
                                <div>
                                    <p className={`text-[10px] font-bold uppercase ${status.text} mb-0.5`}>{status.msg}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black ${status.text}`}>{shipment.total_bags}</span>
                                        <span className="text-xs font-bold opacity-60">/ {shipment.target_bag_capacity}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Actions + SPACE REMAINING */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                            {lastAction ? (
                                <button 
                                    onClick={handleUndoClick} 
                                    disabled={isUndoing} 
                                    className="bg-white text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 hover:bg-slate-50 transition-colors"
                                >
                                    {isUndoing ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} {TXT.undo}
                                </button>
                            ) : (
                                <div className={`p-2 rounded-full ${status.bg} ${status.text} opacity-50 shadow-inner`}><Info className="w-5 h-5" /></div>
                            )}
                            
                            {/* --- THIS IS THE FIX: Always show Remaining Space --- */}
                            <p className="text-[10px] font-bold text-slate-400 uppercase text-right mt-1">
                                {TXT.space_left}: <span className={`text-slate-600 ${remainingSpace < 0 ? 'text-red-600' : ''}`}>{remainingSpace}</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/5 mt-2">
                        <div className={`h-full transition-all duration-500 ${status.bar}`} style={{ width: `${Math.min((shipment.total_bags / shipment.target_bag_capacity) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>
        )}

        {/* --- ROW 3: MANIFEST DRAWER TRIGGER --- */}
        <button onClick={() => setShowManifest(!showManifest)} className="w-full h-8 flex items-center justify-center bg-slate-50 border-t border-slate-200 hover:bg-slate-100 active:bg-slate-200 transition-colors group relative">
            {showManifest ? (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500"><X className="w-3 h-3" /> Close List</div>
            ) : (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-600">
                     <List className="w-3 h-3" /> {TXT.manifest} ({manifest.length}) <ChevronDown className="w-3 h-3" />
                </div>
            )}
        </button>

        {/* --- ROW 4: MANIFEST DRAWER CONTENT --- */}
        {showManifest && (
            <div className="bg-slate-50 border-t border-slate-200 max-h-[65vh] overflow-y-auto p-3 space-y-2 shadow-inner animate-in slide-in-from-top-5">
                <div className="flex justify-between items-center px-1 mb-2">
                    <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <List className="w-3.5 h-3.5" /> {TXT.manifest}
                    </h3>
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                        {TXT.total_loaded}: {shipment.total_bags}
                    </span>
                </div>
                
                {manifest.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic flex flex-col items-center gap-2">
                        <PackagePlus className="w-8 h-8 opacity-20" /> {TXT.empty_manifest}
                    </div>
                ) : (
                    manifest.map((item) => (
                        <div key={item.item_id} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color_code || '#cbd5e1' }} />
                            
                            <div className="pl-3 flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{item.farmer_name}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-600 px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${item.color_code}20`, borderColor: `${item.color_code}40`, color: item.color_code }}>
                                        {item.variety_name}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5 truncate max-w-[100px]">
                                        <MapPin className="w-2.5 h-2.5" /> {item.village_name || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0 pl-2">
                                <div className="text-right">
                                    <span className="block font-black text-slate-800 text-lg leading-none">{item.bags_loaded}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{TXT.bags}</span>
                                </div>
                                <button onClick={() => handleRemoveItem(item)} disabled={isUndoing} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 active:scale-95 transition-colors border border-red-100 shadow-sm">
                                    {isUndoing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* ================= MAIN CONTENT LIST ================= */}
      {!showManifest && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
             {/* Search Bar */}
             <div className="relative group">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={TXT.search_farmer} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all bg-white shadow-sm" />
            </div>
            
            {/* List Header */}
            <div className="flex justify-between items-center px-1">
                 <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    {TXT.ready_load} <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{bestMatches.length}</span>
                 </h3>
                 {refreshing && <LoaderCircle className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>

            {/* Farmers List */}
            <div className="space-y-2.5">
                {bestMatches.length > 0 ? (
                    bestMatches.map((f) => (
                        <LoadCard 
                            key={f.crop_cycle_id} 
                            farmer={f} 
                            shipment={shipment} 
                            onUpdate={() => loadData(true)} 
                            onAction={(qty) => {
                                setLastAction({ cycleId: f.crop_cycle_id, qty, name: f.farmer_name, variety: f.seed_variety }); // <--- Fixed: Saving Variety
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                        />
                    ))
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl opacity-60 flex flex-col items-center">
                        <PackagePlus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold text-slate-400 uppercase">{selectedVillage !== "All" ? `${selectedVillage} માં કોઈ ગુણી નથી` : "કોઈ સ્ટોક નથી"}</p>
                    </div>
                )}
            </div>

            {/* Mismatches */}
            {varietyMismatches.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                    <button onClick={() => setShowVarietyMismatch(!showVarietyMismatch)} className="w-full flex justify-between items-center p-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-100 hover:bg-orange-100 transition-colors">
                        <span className="text-xs font-bold uppercase flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> {TXT.other_variety} ({varietyMismatches.length})</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showVarietyMismatch ? "rotate-180" : ""}`} />
                    </button>
                    {showVarietyMismatch && (
                        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                            {varietyMismatches.map((f) => (
                                <LoadCard key={f.crop_cycle_id} farmer={f} shipment={shipment} onUpdate={() => loadData(true)} onAction={(qty) => setLastAction({ cycleId: f.crop_cycle_id, qty, name: f.farmer_name, variety: f.seed_variety })} warningMessage={TXT.warn_mismatch} />
                            ))}
                        </div>
                    )}
                </div>
            )}
             {/* Location Mismatches */}
            {locationMismatches.length > 0 && (
                <div className="pt-2">
                    <button onClick={() => setShowLocationMismatch(!showLocationMismatch)} className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors">
                        <span className="text-xs font-bold uppercase flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {TXT.other_loc} ({locationMismatches.length})</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showLocationMismatch ? "rotate-180" : ""}`} />
                    </button>
                    {showLocationMismatch && (
                        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                            {locationMismatches.map((f) => (
                                <LoadCard key={f.crop_cycle_id} farmer={f} shipment={shipment} onUpdate={() => loadData(true)} onAction={(qty) => setLastAction({ cycleId: f.crop_cycle_id, qty, name: f.farmer_name, variety: f.seed_variety })} warningMessage={`${TXT.at}: ${f.collection_loc || "Farm"}`} />
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="h-10" />
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT ---
function LoadCard({
  farmer,
  shipment,
  onUpdate,
  onAction,
  warningMessage,
}: {
  farmer: FarmerStock;
  shipment: ActiveShipment;
  onUpdate: () => void;
  onAction: (qty: number) => void;
  warningMessage?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [bags, setBags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const handleAdd = async () => {
    const qty = Number(bags);
    if (!qty || qty <= 0) return;
    if (qty > farmer.bags_remaining) { toast.error(TXT.error_limit); return; }

    const maxCapacity = shipment.target_bag_capacity + 50; 
    const currentTotal = shipment.total_bags;
    const availableSpace = maxCapacity - currentTotal;

    if (qty > availableSpace) { toast.error(TXT.error_truck_full); return; }

    setIsSaving(true);
    const res = await addBagsToShipment(shipment.shipment_id, farmer.crop_cycle_id, qty);

    if (res.success) {
      setIsOpen(false); setBags(""); onUpdate(); onAction(qty);
      toast.success(`${qty} ${TXT.toast_loaded}`);
    } else {
      toast.error(res.message);
    }
    setIsSaving(false);
  };

  const isWarning = !!warningMessage;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden relative ${isOpen ? "ring-2 ring-blue-500 border-transparent shadow-md" : "border-slate-100 hover:border-slate-200"}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 z-10" style={{ backgroundColor: farmer.color_code || "#cbd5e1" }} />
      <div onClick={() => setIsOpen(!isOpen)} className="p-4 pl-6 flex justify-between items-center cursor-pointer active:bg-slate-50 transition-colors">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-slate-800 text-base truncate">{farmer.farmer_name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><MapPin className="w-3 h-3 text-slate-400" /> {farmer.village_name || "Unknown"}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${isWarning ? "bg-orange-100 text-orange-700" : "bg-green-50 text-green-700"}`}>{farmer.seed_variety}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-xl font-black text-slate-900 leading-none">{farmer.bags_remaining}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{TXT.avail}</span>
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pl-6 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="h-px w-full bg-slate-100 mb-4" />
          {isWarning && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-100 text-orange-800 text-xs rounded-xl font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{warningMessage}</p>
                <p className="opacity-80 leading-tight mt-0.5">{TXT.truck_expects} <b>{shipment.seed_varieties.join(", ")}</b> {TXT.at} <b>{shipment.location}</b>.</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <div className="relative w-32">
              <input ref={inputRef} type="number" placeholder={TXT.bags} value={bags} onChange={(e) => setBags(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="w-full p-3.5 text-center font-bold text-lg bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none uppercase">{TXT.bags}</span>
            </div>
            <button onClick={handleAdd} disabled={isSaving || !bags || Number(bags) <= 0} className={`flex-1 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${isWarning ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200" : "bg-slate-900 hover:bg-slate-800 shadow-slate-200"}`}>
              {isSaving ? <><LoaderCircle className="w-5 h-5 animate-spin" /> {TXT.saving}</> : <><PackagePlus className="w-5 h-5" /> {isWarning ? TXT.force_load : TXT.load_bags}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}