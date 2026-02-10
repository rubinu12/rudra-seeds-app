"use client";

import { useState, useMemo } from "react";
import { 
  Wallet, 
  Building2, 
  Tractor, 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";
import FinanceActionModal from "@/src/components/admin/finance/FinanceActionModal";
import { 
  WalletStats, 
  CompanyTradeStats, 
  HarvestMetric, 
  FinanceData 
} from "./actions";

// --- PROPS DEFINITION ---
type Props = {
  walletData: WalletStats;
  tradeData: CompanyTradeStats[];
  harvestData: HarvestMetric[];
  modalData: FinanceData;
};

// --- MAIN COMPONENT ---
export default function FinanceClientView({ 
  walletData, 
  tradeData, 
  harvestData, 
  modalData 
}: Props) {
  
  const [activeTab, setActiveTab] = useState<'WALLET' | 'TRADE' | 'HARVEST'>('WALLET');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* --- 1. SUPER HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Financial Command
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">
            Rudra Seeds Clearing House & Ledger
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* TABS */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              {[
                { id: 'WALLET', label: 'Master Wallet', icon: Wallet },
                { id: 'TRADE', label: 'Trade Book', icon: Building2 },
                { id: 'HARVEST', label: 'Harvest Register', icon: Tractor },
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "stroke-[2.5px]" : ""}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ACTION BUTTON */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
            >
                <Wallet className="w-5 h-5" /> Manage Cash
            </button>
        </div>
      </div>

      {/* --- 2. DYNAMIC CONTENT AREA --- */}
      <div className="min-h-[600px]">
        {activeTab === 'WALLET' && <WalletView data={walletData} />}
        {activeTab === 'TRADE' && <TradeView data={tradeData} />}
        {activeTab === 'HARVEST' && <HarvestView data={harvestData} />}
      </div>

      {/* --- 3. THE TELLER MODAL --- */}
      <FinanceActionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={modalData} 
      />

    </div>
  );
}


// ============================================================================
// SUB-COMPONENT: WALLET VIEW (The Passbook)
// ============================================================================
function WalletView({ data }: { data: WalletStats }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 opacity-90">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                        <Wallet className="w-5 h-5 text-indigo-100" />
                    </div>
                    <span className="font-bold tracking-wide text-indigo-100 uppercase text-xs">Cash In Hand</span>
                </div>
                <div className="text-5xl font-black tracking-tight">
                    ₹{data.balance.toLocaleString('en-IN')}
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-100 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> 
                    Ready to dispense
                </div>
            </div>
        </div>

        {/* Quick Stats (Placeholder logic for demo visual) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Transactions (Last 50)</span>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-800">{data.transactions.length}</span>
                    <span className="text-sm font-bold text-slate-400 mb-1">entries</span>
                </div>
             </div>
             <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                <TrendingUp className="absolute right-4 top-4 w-24 h-24 text-emerald-100 -rotate-12" />
                <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2 relative z-10">System Status</span>
                <div className="text-2xl font-black text-emerald-800 relative z-10">
                    Healthy
                </div>
                <p className="text-emerald-600 text-xs font-bold mt-1 relative z-10">All ledgers synced</p>
             </div>
        </div>
      </div>

      {/* PASSBOOK TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Transaction History</h3>
            <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                <Download className="w-3.5 h-3.5"/> Export CSV
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-slate-500 font-bold text-xs uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-8 py-4">Date & Time</th>
                        <th className="px-8 py-4">Description</th>
                        <th className="px-8 py-4 text-right">Debit (Out)</th>
                        <th className="px-8 py-4 text-right">Credit (In)</th>
                        <th className="px-8 py-4 text-right">Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-8 py-4 font-bold text-slate-600 whitespace-nowrap">
                                {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                <span className="text-slate-300 font-normal ml-2 text-xs">
                                    {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </td>
                            <td className="px-8 py-4 text-slate-800 font-medium">
                                {tx.description}
                            </td>
                            <td className="px-8 py-4 text-right">
                                {tx.type === 'DEBIT' ? (
                                    <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                                        - ₹{Number(tx.amount).toLocaleString('en-IN')}
                                    </span>
                                ) : <span className="text-slate-200">-</span>}
                            </td>
                            <td className="px-8 py-4 text-right">
                                {tx.type === 'CREDIT' ? (
                                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                                        + ₹{Number(tx.amount).toLocaleString('en-IN')}
                                    </span>
                                ) : <span className="text-slate-200">-</span>}
                            </td>
                            <td className="px-8 py-4 text-right font-mono font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                                ₹{tx.balance_after.toLocaleString('en-IN')}
                            </td>
                        </tr>
                    ))}
                    {data.transactions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">
                                No transactions found in history.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// SUB-COMPONENT: TRADE VIEW (Companies)
// ============================================================================
function TradeView({ data }: { data: CompanyTradeStats[] }) {
    const [selectedCompany, setSelectedCompany] = useState<CompanyTradeStats | null>(data[0] || null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] animate-in slide-in-from-right-4 duration-500">
            
            {/* LEFT: Company List */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 text-lg">Company Accounts</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Select a company to view ledger</p>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
                    {data.map(comp => (
                        <div 
                            key={comp.id}
                            onClick={() => setSelectedCompany(comp)}
                            className={`p-5 rounded-2xl cursor-pointer border transition-all relative overflow-hidden group ${
                                selectedCompany?.id === comp.id 
                                    ? "bg-indigo-600 border-indigo-600 shadow-md" 
                                    : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <h4 className={`font-bold text-lg ${selectedCompany?.id === comp.id ? 'text-white' : 'text-slate-800'}`}>
                                    {comp.name}
                                </h4>
                                {comp.current_due > 0 ? (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                        selectedCompany?.id === comp.id 
                                            ? "bg-white/20 text-white" 
                                            : "bg-rose-100 text-rose-600"
                                    }`}>
                                        Due
                                    </span>
                                ) : (
                                    <CheckCircle2 className={`w-5 h-5 ${selectedCompany?.id === comp.id ? "text-emerald-300" : "text-emerald-500"}`} />
                                )}
                            </div>
                            
                            <div className={`flex justify-between items-end relative z-10 ${selectedCompany?.id === comp.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Shipped</span>
                                    <span className="font-bold text-sm">₹{(comp.total_shipped_value/100000).toFixed(2)} Lakh</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">Current Due</span>
                                    <span className={`font-black text-lg ${
                                        selectedCompany?.id === comp.id 
                                            ? "text-white" 
                                            : comp.current_due > 0 ? "text-rose-600" : "text-emerald-600"
                                    }`}>
                                        ₹{comp.current_due.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Ledger Detail */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                 {selectedCompany ? (
                    <>
                        {/* Detail Header */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-100 rounded-xl">
                                        <Building2 className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">{selectedCompany.name}</h2>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Account
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Outstanding</p>
                                <p className={`text-3xl font-black ${selectedCompany.current_due > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                    {selectedCompany.current_due > 0 ? `₹${selectedCompany.current_due.toLocaleString('en-IN')}` : "Settled"}
                                </p>
                            </div>
                        </div>

                        {/* Ledger Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4 text-left">Date</th>
                                        <th className="px-8 py-4 text-left">Details</th>
                                        <th className="px-8 py-4 text-right">Goods Sent (Dr)</th>
                                        <th className="px-8 py-4 text-right">Payment Rcvd (Cr)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedCompany.ledger.map((l, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 text-slate-500 font-medium">
                                                {new Date(l.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-8 py-4 font-bold text-slate-800">
                                                {l.description}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                {l.type === 'DEBIT' ? (
                                                    <span className="font-bold text-slate-800">₹{l.amount.toLocaleString()}</span>
                                                ) : <span className="text-slate-200">-</span>}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                {l.type === 'CREDIT' ? (
                                                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                        ₹{l.amount.toLocaleString()}
                                                    </span>
                                                ) : <span className="text-slate-200">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {selectedCompany.ledger.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                                                No ledger history available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                         <Building2 className="w-16 h-16 mb-4 opacity-20" />
                         <p className="font-bold text-lg">Select a Company</p>
                     </div>
                 )}
            </div>
        </div>
    );
}


// ============================================================================
// SUB-COMPONENT: HARVEST VIEW (Smart Filters)
// ============================================================================
function HarvestView({ data }: { data: HarvestMetric[] }) {
    // Client-side filtering logic
    const [search, setSearch] = useState("");
    const [varietyFilter, setVarietyFilter] = useState("All");
    const [villageFilter, setVillageFilter] = useState("All");

    // Extract Unique Options
    const varieties = ["All", ...Array.from(new Set(data.map(d => d.seed_variety))).filter(Boolean)];
    const villages = ["All", ...Array.from(new Set(data.map(d => d.village_name))).filter(Boolean)];

    // Filter Data
    const filtered = useMemo(() => {
        return data.filter(d => {
            const matchesSearch = d.farmer_name.toLowerCase().includes(search.toLowerCase());
            const matchesVariety = varietyFilter === "All" || d.seed_variety === varietyFilter;
            const matchesVillage = villageFilter === "All" || d.village_name === villageFilter;
            return matchesSearch && matchesVariety && matchesVillage;
        });
    }, [data, search, varietyFilter, villageFilter]);

    // Calculate Aggregates (Smart Header)
    const totals = useMemo(() => {
        return filtered.reduce((acc, curr) => ({
            bags: acc.bags + curr.production_bags,
            area: acc.area + curr.sown_area_vigha,
            commission: acc.commission + (curr.production_bags * 10), // Assuming 10rs/bag commission for display
            due: acc.due + curr.amount_due
        }), { bags: 0, area: 0, commission: 0, due: 0 });
    }, [filtered]);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. SMART AGGREGATE HEADER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    label="Total Volume" 
                    value={`${totals.bags.toLocaleString()} Bags`} 
                    subValue="Production"
                    icon={Tractor} 
                    colorClass="bg-orange-50 text-orange-600 ring-1 ring-orange-100"
                />
                <MetricCard 
                    label="Active Land" 
                    value={`${totals.area.toLocaleString()} Vigha`} 
                    subValue="Sown Area"
                    icon={Building2} 
                    colorClass="bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                />
                <MetricCard 
                    label="Est. Commission" 
                    value={`₹${totals.commission.toLocaleString()}`} 
                    subValue="Projected Revenue"
                    icon={TrendingUp} 
                    colorClass="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                />
                <MetricCard 
                    label="Farmer Liability" 
                    value={`₹${totals.due.toLocaleString()}`} 
                    subValue="Pending Payouts"
                    icon={AlertCircle} 
                    colorClass="bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                />
            </div>

            {/* 2. ADVANCED FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        placeholder="Search Farmer Name..." 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm outline-none placeholder:text-slate-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        <select 
                            className="pl-10 pr-10 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none hover:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 transition-all appearance-none cursor-pointer min-w-[180px]"
                            value={varietyFilter}
                            onChange={(e) => setVarietyFilter(e.target.value)}
                        >
                            {varieties.map(v => <option key={v} value={v}>{v === 'All' ? 'All Varieties' : v}</option>)}
                        </select>
                    </div>
                    
                    <div className="relative group">
                        <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        <select 
                            className="pl-10 pr-10 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none hover:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 transition-all appearance-none cursor-pointer min-w-[180px]"
                            value={villageFilter}
                            onChange={(e) => setVillageFilter(e.target.value)}
                        >
                            {villages.map(v => <option key={v} value={v}>{v === 'All' ? 'All Villages' : v}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. DATA GRID */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4">Farmer</th>
                            <th className="px-8 py-4">Details</th>
                            <th className="px-8 py-4 text-right">Yield (Bags)</th>
                            <th className="px-8 py-4 text-right">Cycle Value</th>
                            <th className="px-8 py-4 text-right">Due Amount</th>
                            <th className="px-8 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(row => (
                            <tr key={row.farmer_id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-4 font-bold text-slate-800 text-base">
                                    {row.farmer_name}
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded w-fit">
                                            {row.seed_variety}
                                        </span>
                                        <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                                            <Building2 className="w-3 h-3" /> {row.village_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-right font-mono font-bold text-slate-700 text-base">
                                    {row.production_bags}
                                </td>
                                <td className="px-8 py-4 text-right font-mono font-bold text-slate-500">
                                    ₹{row.total_cycle_value.toLocaleString()}
                                </td>
                                <td className="px-8 py-4 text-right">
                                    {row.amount_due > 0 ? (
                                        <span className="text-rose-600 font-black bg-rose-50 px-3 py-1 rounded-lg">
                                            ₹{row.amount_due.toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                                        </span>
                                    )}
                                </td>
                                <td className="px-8 py-4 text-center">
                                    {row.amount_due > 0 && (
                                        <button className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors border border-indigo-100">
                                            Pay Now
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filtered.length === 0 && (
                    <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p>No harvest records match your filters.</p>
                        <button 
                            onClick={() => {setSearch(""); setVarietyFilter("All"); setVillageFilter("All");}}
                            className="mt-4 text-indigo-600 font-bold hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- HELPER CARD COMPONENT ---
function MetricCard({ label, value, subValue, icon: Icon, colorClass }: any) {
  return (
    <div className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden transition-all hover:shadow-md group`}>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        {subValue && <p className="text-xs font-bold text-slate-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-4 rounded-2xl ${colorClass} transition-transform group-hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}