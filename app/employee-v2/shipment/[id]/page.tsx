"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, CheckCircle, PackagePlus, AlertTriangle, Search, 
    ChevronDown, ChevronUp, Info, Scale, Leaf, Building, MapPin, 
    Truck, RotateCcw, LoaderCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    getShipmentById, 
    getFarmersForLoading, 
    getActiveShipments, 
    addBagsToShipment, 
    markShipmentAsFilled, 
    undoLastLoad,
    ActiveShipment, 
    FarmerStock 
} from '@/app/employee-v2/actions/shipments';

const LOCATIONS = ["Parabadi yard", "Dhoraji yard", "Jalasar yard", "Farm"];

export default function ShipmentDetailsPage() {
    const params = useParams(); 
    const id = Number(params?.id); 
    const router = useRouter();
    
    // Data State
    const [shipment, setShipment] = useState<ActiveShipment | null>(null);
    const [farmers, setFarmers] = useState<FarmerStock[]>([]);
    const [otherShipments, setOtherShipments] = useState<ActiveShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);

    // UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [currentLocation, setCurrentLocation] = useState(""); 
    
    // Accordions & Switchers
    const [showVarietyMismatch, setShowVarietyMismatch] = useState(false);
    const [showLocationMismatch, setShowLocationMismatch] = useState(false);
    const [showTruckSwitcher, setShowTruckSwitcher] = useState(false);
    const [showLocationSwitcher, setShowLocationSwitcher] = useState(false);

    // Persistent Undo State
    const [lastAction, setLastAction] = useState<{cycleId: number, qty: number, name: string} | null>(null);
    const [isUndoing, setIsUndoing] = useState(false);

    // Initial Load
    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sData, fData, allShipments] = await Promise.all([
                getShipmentById(id),
                getFarmersForLoading(),
                getActiveShipments()
            ]);
            setShipment(sData);
            setFarmers(fData);
            setOtherShipments(allShipments.filter(s => s.shipment_id !== id));
            
            if (sData && !currentLocation) {
                setCurrentLocation(sData.location || "Parabadi yard");
            }
        } catch (error) {
            toast.error("Failed to load truck details");
        } finally {
            setLoading(false);
        }
    };

    // --- STATUS LOGIC ---
    const getStatusInfo = (current: number, target: number) => {
        const diff = current - target;
        const absDiff = Math.abs(diff);
        const isWithinTolerance = diff >= -50 && diff <= 50;
        
        if (diff > 50) return { status: 'OVER', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500', msg: `Overfilled by ${diff} bags`, canConfirm: false };
        if (diff < -50) return { status: 'UNDER', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500', msg: `${absDiff} more bags needed`, canConfirm: false };
        
        return { 
            status: 'READY', 
            color: 'text-green-700', 
            bg: 'bg-green-100', 
            bar: 'bg-green-600', 
            msg: 'Ready to Confirm', 
            canConfirm: isWithinTolerance 
        };
    };

    const handleMarkFilled = async () => {
        if (!shipment) return;
        
        const confirmMsg = `Are you sure? This will lock the shipment and send it to Admin for dispatch.`;
        if (!window.confirm(confirmMsg)) return;

        setIsConfirming(true);
        const res = await markShipmentAsFilled(shipment.shipment_id);
        
        if (res.success) {
            toast.success("Shipment Confirmed Successfully!");
            router.push('/employee-v2/dashboard');
        } else {
            toast.error(res.message);
            setIsConfirming(false);
        }
    };

    const handleUndoClick = async () => {
        if (!shipment || !lastAction) return;
        setIsUndoing(true);
        const res = await undoLastLoad(shipment.shipment_id, lastAction.cycleId, lastAction.qty);
        if (res.success) {
            toast.success(`Restored ${lastAction.qty} bags`);
            setLastAction(null);
            await loadData();
        } else {
            toast.error("Undo failed");
        }
        setIsUndoing(false);
    };

    if (loading || !shipment) return <div className="flex h-screen items-center justify-center text-slate-400 gap-2"><Scale className="w-6 h-6 animate-pulse" /> Loading...</div>;

    const statusInfo = getStatusInfo(shipment.total_bags, shipment.target_bag_capacity);

    // --- SORTING LOGIC ---
    const searchFiltered = farmers.filter(f => 
        f.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.village_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLocationMatch = (farmerLoc: string | null) => {
        const target = (currentLocation || "").toLowerCase().replace(" yard", "").trim();
        const farmer = (farmerLoc || "Farm").toLowerCase().replace(" yard", "").trim();
        return farmer.includes(target);
    };

    const isVarietyMatch = (seedId: number) => (shipment.allowed_seed_ids || []).includes(seedId);

    const bestMatches: FarmerStock[] = [];
    const varietyMismatches: FarmerStock[] = [];
    const locationMismatches: FarmerStock[] = [];

    searchFiltered.forEach(f => {
        if (!isLocationMatch(f.collection_loc)) locationMismatches.push(f);
        else if (isVarietyMatch(f.seed_id)) bestMatches.push(f);
        else varietyMismatches.push(f);
    });

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* --- HEADER --- */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                
                {/* Top Nav */}
                <div className="px-4 py-3 flex items-center justify-between relative">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        
                        <div className="relative flex-1 min-w-0">
                            <button onClick={() => setShowTruckSwitcher(!showTruckSwitcher)} className="flex items-center gap-2 text-left w-full group active:opacity-70 transition-opacity">
                                <div className="truncate">
                                    <h1 className="font-black text-xl text-slate-900 leading-none flex items-center gap-2">
                                        {shipment.vehicle_number} <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${showTruckSwitcher ? 'rotate-180' : ''}`} />
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate"><Building className="w-3 h-3 shrink-0" /> {shipment.company_name}</span>
                                    </div>
                                </div>
                            </button>
                            {showTruckSwitcher && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowTruckSwitcher(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-[70] max-h-72 overflow-y-auto animate-in slide-in-from-top-2">
                                        <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0">Switch Truck</div>
                                        {otherShipments.map(s => {
                                            const rem = s.target_bag_capacity - s.total_bags;
                                            return (
                                                <div key={s.shipment_id} onClick={() => router.push(`/employee-v2/shipment/${s.shipment_id}`)} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer active:bg-slate-100 transition-colors">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-800 text-sm">{s.vehicle_number}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${rem < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{rem} Rem</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 truncate font-medium">{s.company_name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative shrink-0 ml-2">
                        <button onClick={() => setShowLocationSwitcher(!showLocationSwitcher)} className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-xl active:scale-95 transition-transform"><MapPin className="w-3.5 h-3.5" /> {(currentLocation || "").replace(" yard", "")}</button>
                        {showLocationSwitcher && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setShowLocationSwitcher(false)} />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-[70] animate-in slide-in-from-top-2 overflow-hidden">
                                    <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">My Location</div>
                                    {LOCATIONS.map(loc => (
                                        <div key={loc} onClick={() => { setCurrentLocation(loc); setShowLocationSwitcher(false); }} className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer text-sm font-bold transition-colors ${currentLocation === loc ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>{loc}</div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress & Actions Card */}
                <div className="px-4 pb-4">
                    <div className={`p-4 rounded-2xl border ${statusInfo.bg} border-transparent relative overflow-hidden flex justify-between items-center transition-all`}>
                        
                        {lastAction ? (
                            <div className="flex-1 flex items-center justify-between mr-2 animate-in fade-in slide-in-from-bottom-2">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /> Success</p>
                                    <p className="font-bold text-slate-800 text-sm">{lastAction.qty} Bags • {lastAction.name}</p>
                                </div>
                                <button onClick={handleUndoClick} disabled={isUndoing} className="bg-white text-slate-900 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-70 transition-all hover:bg-slate-50">
                                    {isUndoing ? <LoaderCircle className="w-3 h-3 animate-spin text-blue-600" /> : <RotateCcw className="w-3 h-3" />} Undo
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <p className={`text-xs font-bold uppercase ${statusInfo.color}`}>{statusInfo.msg}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${statusInfo.color}`}>{shipment.total_bags}</span>
                                    <span className="text-sm font-bold opacity-60">/ {shipment.target_bag_capacity}</span>
                                </div>
                            </div>
                        )}
                        
                        {!lastAction && (
                            <button 
                                onClick={handleMarkFilled} 
                                disabled={!statusInfo.canConfirm || isConfirming} 
                                className={`relative z-10 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all
                                    ${statusInfo.canConfirm 
                                        ? 'bg-slate-900 text-white shadow-md active:scale-95 hover:bg-black' 
                                        : 'bg-white/60 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {isConfirming ? <LoaderCircle className="w-4 h-4 animate-spin" /> : (statusInfo.canConfirm ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />)}
                                {isConfirming ? "Saving..." : (statusInfo.canConfirm ? "Confirm" : "Loading")}
                            </button>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/5"><div className={`h-full transition-all duration-500 ${statusInfo.bar}`} style={{ width: `${Math.min((shipment.total_bags / shipment.target_bag_capacity) * 100, 100)}%` }} /></div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search farmer name..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10 transition-shadow" />
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-400 ml-1 tracking-wider flex justify-between">
                        <span>Ready to Load ({bestMatches.length})</span>
                        <span className="text-blue-600">{(currentLocation || "").replace(" yard", "")}</span>
                    </h3>
                    {bestMatches.length > 0 ? (
                        bestMatches.map(f => <LoadCard key={f.crop_cycle_id} farmer={f} shipment={shipment} onUpdate={loadData} onAction={(qty) => setLastAction({ cycleId: f.crop_cycle_id, qty, name: f.farmer_name })} />)
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl opacity-50"><PackagePlus className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p className="text-xs font-bold text-slate-400 uppercase">No stock at {currentLocation || "Location"}</p></div>
                    )}
                </div>

                {varietyMismatches.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                        <button onClick={() => setShowVarietyMismatch(!showVarietyMismatch)} className="w-full flex justify-between items-center p-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-100 hover:bg-orange-100 transition-colors">
                            <span className="text-xs font-bold uppercase flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Other Varieties ({varietyMismatches.length})</span>
                            {showVarietyMismatch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showVarietyMismatch && <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">{varietyMismatches.map(f => <LoadCard key={f.crop_cycle_id} farmer={f} shipment={shipment} onUpdate={loadData} onAction={(qty) => setLastAction({ cycleId: f.crop_cycle_id, qty, name: f.farmer_name })} warningMessage="Variety Mismatch" />)}</div>}
                    </div>
                )}

                {locationMismatches.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                        <button onClick={() => setShowLocationMismatch(!showLocationMismatch)} className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors">
                            <span className="text-xs font-bold uppercase flex items-center gap-2"><MapPin className="w-4 h-4" /> Other Locations ({locationMismatches.length})</span>
                            {showLocationMismatch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showLocationMismatch && <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">{locationMismatches.map(f => <LoadCard key={f.crop_cycle_id} farmer={f} shipment={shipment} onUpdate={loadData} onAction={(qty) => setLastAction({ cycleId: f.crop_cycle_id, qty, name: f.farmer_name })} warningMessage={`Location: ${f.collection_loc || "Farm"}`} />)}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

function LoadCard({ farmer, shipment, onUpdate, onAction, warningMessage }: { farmer: FarmerStock, shipment: ActiveShipment, onUpdate: () => void, onAction: (qty: number) => void, warningMessage?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [bags, setBags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleAdd = async () => {
        const qty = Number(bags);
        if (!qty || qty <= 0) return;

        if (qty > farmer.bags_remaining) { toast.error(`Limit Exceeded: Farmer only has ${farmer.bags_remaining} bags.`); return; }

        const maxCapacity = shipment.target_bag_capacity + 50;
        const currentTotal = shipment.total_bags;
        const availableSpace = maxCapacity - currentTotal;

        if (qty > availableSpace) { toast.error(`Truck Full: Only ${availableSpace} bags can fit.`); return; }

        setIsSaving(true);
        const res = await addBagsToShipment(shipment.shipment_id, farmer.crop_cycle_id, qty);
        
        if (res.success) {
            setIsOpen(false);
            setBags('');
            onUpdate();
            onAction(qty);
            toast.success(`Loaded ${qty} bags`);
        } else {
            toast.error(res.message);
        }
        setIsSaving(false);
    };

    const isWarning = !!warningMessage;

    return (
        <div className={`bg-white rounded-2xl border shadow-sm transition-all overflow-hidden relative ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-slate-100'}`}>
            {/* Color Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-10" style={{ backgroundColor: farmer.color_code || '#cbd5e1' }} />

            <div onClick={() => setIsOpen(!isOpen)} className="p-4 pl-6 flex justify-between items-center cursor-pointer active:bg-slate-50 transition-colors">
                <div>
                    <h3 className="font-bold text-slate-800 text-base">{farmer.farmer_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {farmer.collection_loc || "Farm"}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isWarning ? 'bg-orange-100 text-orange-700' : 'bg-green-50 text-green-700'}`}>{farmer.seed_variety}</span>
                    </div>
                </div>
                <div className="text-right"><span className="block text-xl font-black text-slate-900 leading-none">{farmer.bags_remaining}</span><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Avail</span></div>
            </div>
            {isOpen && (
                <div className="px-4 pl-6 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="h-px w-full bg-slate-100 mb-4" />
                    {isWarning && <div className="mb-3 p-3 bg-orange-50 border border-orange-100 text-orange-800 text-xs rounded-xl font-medium flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><div><p className="font-bold">{warningMessage}</p><p className="opacity-80 leading-tight mt-0.5">Truck expects: <b>{shipment.seed_varieties.join(", ")}</b> at <b>{shipment.location}</b>.</p></div></div>}
                    <div className="flex gap-3">
                        <div className="relative w-28"><input type="number" placeholder="Qty" value={bags} autoFocus onChange={e => setBags(e.target.value)} className="w-full p-3.5 text-center font-bold text-lg bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">BAGS</span></div>
                        <button onClick={handleAdd} disabled={isSaving || !bags || Number(bags) <= 0} className={`flex-1 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 ${isWarning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 hover:bg-slate-800'}`}>{isSaving ? "Saving..." : <><PackagePlus className="w-5 h-5" /> {isWarning ? "Force Load" : "Load Bags"}</>}</button>
                    </div>
                </div>
            )}
        </div>
    );
}