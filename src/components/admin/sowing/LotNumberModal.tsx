"use client";

import { useState, useEffect } from 'react';
import { 
    Search, Upload, Save, Sprout, FileJson, AlertCircle, Filter, LoaderCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    getLotMasterData,
    getSowingData, 
    updateLotNumber, 
    bulkImportLotNumbers, 
    SowingEntry 
} from '@/src/app/admin/actions/lotManagement';
import Modal from '@/src/components/ui/Modal'; 

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

type SeedOption = { seed_id: number; variety_name: string };

export default function LotNumberModal({ isOpen, onClose }: Props) {
    const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
    const [seeds, setSeeds] = useState<SeedOption[]>([]);
    const [selectedSeed, setSelectedSeed] = useState<number | "">(""); 
    
    const [data, setData] = useState<SowingEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Load Seeds on Open
    useEffect(() => {
        if (isOpen) {
            getLotMasterData().then(res => setSeeds(res.seeds as SeedOption[]));
        }
    }, [isOpen]);

    // Load Data when Seed Changes
    useEffect(() => {
        if (!selectedSeed) {
            setData([]); 
            return;
        }
        loadData();
    }, [selectedSeed]);

    const loadData = async () => {
        if(!selectedSeed) return;
        setLoading(true);
        const res = await getSowingData(Number(selectedSeed));
        setData(res);
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Lot Numbers">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filter by Seed Variety (Required)
                </label>
                <select 
                    value={selectedSeed} 
                    onChange={(e) => setSelectedSeed(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-black outline-none"
                >
                    <option value="">-- Select Seed to Begin --</option>
                    {seeds.map((s) => (
                        <option key={s.seed_id} value={s.seed_id}>{s.variety_name}</option>
                    ))}
                </select>
            </div>

            <div className={`flex gap-2 mb-4 border-b border-slate-100 pb-2 transition-opacity ${!selectedSeed ? 'opacity-50 pointer-events-none' : ''}`}>
                <button 
                    onClick={() => setMode('manual')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Sprout className="w-4 h-4" /> Manual Entry
                </button>
                <button 
                    onClick={() => setMode('bulk')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'bulk' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileJson className="w-4 h-4" /> AI / Bulk Import
                </button>
            </div>

            <div className="h-[55vh] overflow-hidden relative">
                {!selectedSeed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm z-10">
                        <Sprout className="w-12 h-12 mb-2 opacity-20" />
                        <p className="font-bold">Please select a seed variety above</p>
                    </div>
                ) : null}

                {mode === 'manual' ? (
                    <ManualTab data={data} loading={loading} />
                ) : (
                    <BulkTab 
                        seedId={Number(selectedSeed)} 
                        seedName={seeds.find(s => s.seed_id === selectedSeed)?.variety_name || ""}
                        refresh={loadData} 
                    />
                )}
            </div>
        </Modal>
    );
}

// --- SUB COMPONENTS ---

function ManualTab({ data, loading }: { data: SowingEntry[], loading: boolean }) {
    const [search, setSearch] = useState("");
    
    const filtered = data.filter(d => 
        d.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
        d.village_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name in this list..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-black/5 font-medium text-sm"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                        <LoaderCircle className="w-6 h-6 animate-spin" />
                        Loading Farmers...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No farmers found for this seed</div>
                ) : (
                    filtered.map(item => (
                        <LotRow key={item.crop_cycle_id} item={item} />
                    ))
                )}
            </div>
        </div>
    );
}

function LotRow({ item }: { item: SowingEntry }) {
    const [val, setVal] = useState(item.lot_no || "");
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const res = await updateLotNumber(item.crop_cycle_id, val);
        if (res.success) {
            toast.success("Saved");
            setIsDirty(false);
        } else {
            toast.error("Failed");
        }
        setSaving(false);
    };

    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-300 transition-all">
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{item.farmer_name}</p>
                <div className="flex gap-2 text-xs text-slate-500 truncate">
                    <span>{item.village_name}</span>
                    <span>•</span>
                    <span>Sown: {item.sowing_date}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input 
                    value={val}
                    onChange={e => { setVal(e.target.value); setIsDirty(true); }}
                    placeholder="LOT NO"
                    className={`w-28 px-2 py-1.5 rounded-lg border text-sm font-bold outline-none focus:ring-2 uppercase transition-all
                        ${val ? 'bg-white border-slate-200' : 'bg-yellow-50 border-yellow-200 placeholder:text-yellow-400'}
                    `}
                />
                {isDirty && (
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}

function BulkTab({ seedId, seedName, refresh }: { seedId: number, seedName: string, refresh: () => void }) {
    const [json, setJson] = useState("");
    const [loading, setLoading] = useState(false);

    const handleImport = async () => {
        if (!json.trim()) return;
        setLoading(true);
        const res = await bulkImportLotNumbers(json, seedId);
        setLoading(false);
        
        if (res.success) {
            toast.success(res.message);
            setJson(""); // Clear on success
            refresh();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 space-y-1">
                        <p className="font-bold">Bulk Import for <span className="underline">{seedName}</span>:</p>
                        <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                            <li>This will only update farmers who are growing <b>{seedName}</b>.</li>
                            <li>Upload PDF to AI &rarr; Ask for JSON Array.</li>
                            <li>Format: <code className="bg-white px-1 rounded border border-blue-200">[ &#123; &quot;name&quot;: &quot;Ramesh&quot;, &quot;lot&quot;: &quot;L-101&quot; &#125; ]</code></li>
                        </ul>
                    </div>
                </div>
            </div>

            <textarea 
                value={json}
                onChange={e => setJson(e.target.value)}
                placeholder={`Paste JSON here for ${seedName}...`}
                className="flex-1 w-full p-4 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-black outline-none resize-none"
            />

            <button 
                onClick={handleImport}
                disabled={loading || !json}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
                {loading ? "Updating Database..." : <><Upload className="w-4 h-4" /> Import Lot Numbers</>}
            </button>
        </div>
    );
}