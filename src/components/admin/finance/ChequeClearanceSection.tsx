"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Calendar, Search, LoaderCircle, CreditCard } from "lucide-react";
import { clearCheque } from "@/src/app/admin/finance/actions";
import { toast } from "sonner";

export default function ChequeClearanceSection({ cheques, wallets }: any) {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedWallet, setSelectedWallet] = useState(wallets[0]?.wallet_id);
  const [searchTerm, setSearchTerm] = useState("");

  const handleClear = async (cheque: any) => {
    const walletName = wallets.find((w: any) => w.wallet_id === selectedWallet)?.wallet_name;
    
    if (!window.confirm(`Mark cheque #${cheque.cheque_number} as CLEARED? \n\nThis will deduct ₹${cheque.amount.toLocaleString()} from ${walletName}.`)) return;
    
    setProcessingId(cheque.crop_cycle_id);
    const res = await clearCheque(cheque.crop_cycle_id, selectedWallet, cheque.amount);
    
    if (res.success) {
      toast.success("Cheque Cleared Successfully");
    } else {
      toast.error("Failed to clear cheque");
    }
    setProcessingId(null);
  };

  // Filter Logic: Search + Date
  const filteredCheques = cheques.filter((c: any) => 
    c.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cheque_number.includes(searchTerm)
  );

  // Separate Due Today/Past vs Future
  const today = new Date().toISOString().split('T')[0];
  const dueList = filteredCheques.filter((c: any) => c.due_date <= today);
  const upcomingList = filteredCheques.filter((c: any) => c.due_date > today);

  const totalDueAmount = dueList.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Wallet Select */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-slate-700" />
            Cheque Clearance Center
          </h2>
          <p className="text-sm text-slate-500">Reconcile cleared cheques with your bank statement.</p>
        </div>
        
        {/* Wallet Selector */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">Deduct From</label>
            <select 
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(Number(e.target.value))}
            className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
            {wallets.map((w: any) => (
                <option key={w.wallet_id} value={w.wallet_id}>
                {w.wallet_name} (₹{Number(w.balance).toLocaleString()})
                </option>
            ))}
            </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by Farmer Name or Cheque No..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all bg-slate-50 focus:bg-white"
        />
      </div>

      {/* Stats Summary */}
      {dueList.length > 0 && (
          <div className="flex gap-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <div>
                  <p className="text-xs font-bold text-orange-700 uppercase">Total Payable Today</p>
                  <p className="text-2xl font-black text-orange-900">₹{totalDueAmount.toLocaleString()}</p>
              </div>
              <div className="w-px bg-orange-200"></div>
              <div>
                  <p className="text-xs font-bold text-orange-700 uppercase">Pending Cheques</p>
                  <p className="text-2xl font-black text-orange-900">{dueList.length}</p>
              </div>
          </div>
      )}

      {/* Due List (High Priority) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-red-600 tracking-wider flex items-center gap-2 mt-2">
          <AlertCircle className="w-4 h-4" /> Due / Overdue ({dueList.length})
        </h3>
        
        {dueList.length === 0 && <p className="text-sm text-slate-400 italic py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">No pending cheques due today.</p>}

        {dueList.map((c: any) => (
          <ChequeRow key={c.crop_cycle_id} cheque={c} onClear={() => handleClear(c)} isProcessing={processingId === c.crop_cycle_id} />
        ))}
      </div>

      {/* Upcoming List (Low Priority) */}
      {upcomingList.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Upcoming ({upcomingList.length})
          </h3>
          {upcomingList.map((c: any) => (
            <ChequeRow key={c.crop_cycle_id} cheque={c} onClear={() => handleClear(c)} isProcessing={processingId === c.crop_cycle_id} isUpcoming />
          ))}
        </div>
      )}
    </div>
  );
}

function ChequeRow({ cheque, onClear, isProcessing, isUpcoming }: any) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${isUpcoming ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-red-100 hover:border-red-200 hover:shadow-md'}`}>
      <div>
        <h4 className="font-bold text-slate-900 text-lg leading-tight">{cheque.farmer_name}</h4>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
            #{cheque.cheque_number}
            </span>
            <span className="text-xs text-slate-500">
            Due: {new Date(cheque.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <span className="font-black text-slate-900 text-xl">₹{Number(cheque.amount).toLocaleString()}</span>
        <button
          onClick={onClear}
          disabled={isProcessing}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
            isUpcoming 
              ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' 
              : 'bg-green-600 text-white shadow-green-200 hover:bg-green-700 active:scale-95'
          }`}
        >
          {isProcessing ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4" />}
          {isProcessing ? "Saving..." : "Clear"}
        </button>
      </div>
    </div>
  );
}