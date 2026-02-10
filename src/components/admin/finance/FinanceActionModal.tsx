"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { 
  X, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  RefreshCw,
  Settings
} from "lucide-react";
import { 
  adjustBalance, 
  receiveCompanyPayment, 
  clearCheque, 
  refreshModalData,
  FinanceData, 
  ChequeItem 
} from "@/src/app/admin/finance/actions";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: FinanceData; // Initial Data from Server
};

export default function FinanceActionModal({ isOpen, onClose, data: serverData }: Props) {
  const [activeTab, setActiveTab] = useState<'PAY_FARMER' | 'RECEIVE_MONEY'>('PAY_FARMER');
  
  // Local State for "Live" experience without page reload
  const [localData, setLocalData] = useState<FinanceData>(serverData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Inputs
  const [amount, setAmount] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [searchCheque, setSearchCheque] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Manual Adjustment Mode
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [manualBalance, setManualBalance] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Sync prop data when modal opens/changes
  useEffect(() => {
    setLocalData(serverData);
  }, [serverData, isOpen]);

  // --- ACTIONS ---

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
        const fresh = await refreshModalData();
        setLocalData(fresh);
        toast.success("Data synced with ledger");
    } catch (e) {
        toast.error("Failed to refresh");
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedCompany || !amount) return toast.error("Please fill all fields");
    setIsSubmitting(true);
    
    const res = await receiveCompanyPayment(Number(selectedCompany), Number(amount));
    if (res.success) {
        toast.success("Payment Received Successfully");
        setAmount("");
        // Optimistic Update
        setLocalData(prev => ({
            ...prev,
            balance: prev.balance + Number(amount)
        }));
        // Trigger background refresh to be safe
        handleRefresh();
    } else {
        toast.error("Failed to record payment");
    }
    setIsSubmitting(false);
  };

  const handleClearCheque = async (cheque: ChequeItem) => {
    if (localData.balance < cheque.amount) {
        return toast.error("Insufficient Cash in Wallet!");
    }
    
    // 1. Optimistic Update (Instant Feedback)
    const originalData = { ...localData }; // Backup
    setLocalData(prev => ({
        ...prev,
        balance: prev.balance - cheque.amount,
        totalDebt: prev.totalDebt - cheque.amount,
        debtCheques: prev.debtCheques.filter(c => c.index !== cheque.index || c.cycle_id !== cheque.cycle_id)
    }));

    try {
        // 2. Server Action
        const res = await clearCheque(cheque.cycle_id, cheque.index, cheque.amount);
        if (res.success) {
            toast.success(`Cleared: ₹${cheque.amount.toLocaleString()}`);
            // 3. Background Sync (Optional, but good for consistency)
            // We don't await this to keep UI snappy
            refreshModalData().then(setLocalData); 
        } else {
            throw new Error("Failed");
        }
    } catch (e) {
        // Revert on failure
        setLocalData(originalData);
        toast.error("Failed to clear cheque");
    }
  };

  const handleAdjustment = async () => {
     if(!manualBalance || !adjustmentReason) return toast.error("Details required");
     setIsSubmitting(true);
     const res = await adjustBalance(Number(manualBalance), adjustmentReason);
     if(res.success) {
         toast.success("Balance Adjusted");
         setIsAdjusting(false);
         handleRefresh();
     }
     setIsSubmitting(false);
  };

  // --- UI HELPERS ---
  const filteredCheques = localData.debtCheques.filter(c => 
     c.farmer_name.toLowerCase().includes(searchCheque.toLowerCase()) || 
     c.cheque_number.includes(searchCheque)
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                
                {/* --- 1. PROFESSIONAL HEADER --- */}
                <div className="bg-slate-900 px-6 py-5 flex justify-between items-start text-white">
                    <div>
                        <Dialog.Title as="h3" className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-indigo-400" />
                            Cash Command
                        </Dialog.Title>
                        <p className="text-slate-400 text-sm mt-1">Manage Ledger & Clearances</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Live Balance Card */}
                        <div className="text-right">
                             <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                 Cash In Hand
                                 <button onClick={() => setIsAdjusting(!isAdjusting)} className="hover:text-white transition-colors">
                                     <Settings className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                             {isAdjusting ? (
                                 <div className="flex items-center gap-2 animate-in fade-in">
                                     <input 
                                        autoFocus
                                        className="w-24 bg-slate-800 border-none rounded px-2 py-0.5 text-right font-mono font-bold text-white focus:ring-1 focus:ring-indigo-500 text-sm"
                                        placeholder="New Bal"
                                        value={manualBalance}
                                        onChange={e => setManualBalance(e.target.value)}
                                     />
                                     <input 
                                        className="w-32 bg-slate-800 border-none rounded px-2 py-0.5 text-xs text-white"
                                        placeholder="Reason..."
                                        value={adjustmentReason}
                                        onChange={e => setAdjustmentReason(e.target.value)}
                                     />
                                     <button 
                                        onClick={handleAdjustment}
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-500 text-white p-1 rounded"
                                     >
                                         <CheckCircle2 className="w-3 h-3"/>
                                     </button>
                                 </div>
                             ) : (
                                 <div className={`text-3xl font-black tracking-tight ${localData.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                     ₹{localData.balance.toLocaleString('en-IN')}
                                 </div>
                             )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                             <button 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                                title="Sync with Database"
                             >
                                 <RefreshCw className="w-5 h-5" />
                             </button>
                             <button 
                                onClick={onClose}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-all"
                             >
                                 <X className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                </div>

                {/* --- 2. TABS & CONTENT --- */}
                <div className="flex h-[550px]">
                    
                    {/* SIDEBAR TABS */}
                    <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('PAY_FARMER')}
                            className={`w-full text-left px-4 py-4 rounded-xl flex flex-col gap-1 transition-all ${
                                activeTab === 'PAY_FARMER' 
                                    ? "bg-white shadow-md ring-1 ring-slate-200" 
                                    : "hover:bg-slate-100 text-slate-500"
                            }`}
                        >
                            <span className={`flex items-center gap-2 font-bold text-sm ${activeTab === 'PAY_FARMER' ? "text-rose-600" : ""}`}>
                                <ArrowUpRight className="w-4 h-4" /> Money Out
                            </span>
                            <span className="text-xs text-slate-400">Clear Farmer Cheques</span>
                            <span className="text-xl font-black text-slate-800 mt-1">
                                ₹{localData.totalDebt.toLocaleString()}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('RECEIVE_MONEY')}
                            className={`w-full text-left px-4 py-4 rounded-xl flex flex-col gap-1 transition-all ${
                                activeTab === 'RECEIVE_MONEY' 
                                    ? "bg-white shadow-md ring-1 ring-slate-200" 
                                    : "hover:bg-slate-100 text-slate-500"
                            }`}
                        >
                            <span className={`flex items-center gap-2 font-bold text-sm ${activeTab === 'RECEIVE_MONEY' ? "text-emerald-600" : ""}`}>
                                <ArrowDownLeft className="w-4 h-4" /> Money In
                            </span>
                            <span className="text-xs text-slate-400">Receive from Company</span>
                        </button>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar relative">
                        
                        {/* TAB 1: PAY FARMER (Clear Cheque) */}
                        {activeTab === 'PAY_FARMER' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                {/* Search Bar */}
                                <div className="sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input 
                                            placeholder="Search by Farmer Name or Cheque No..." 
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-700 placeholder:text-slate-400"
                                            value={searchCheque}
                                            onChange={e => setSearchCheque(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-2 flex justify-between items-center px-1">
                                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                             Pending Clearances ({filteredCheques.length})
                                         </span>
                                         {localData.balance < localData.totalDebt && (
                                             <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                                 <AlertCircle className="w-3 h-3" />
                                                 Shortage: ₹{(localData.totalDebt - localData.balance).toLocaleString()}
                                             </span>
                                         )}
                                    </div>
                                </div>

                                {/* List */}
                                <div className="space-y-2">
                                    {filteredCheques.length > 0 ? filteredCheques.map((cheque) => (
                                        <div 
                                            key={`${cheque.cycle_id}-${cheque.index}`}
                                            className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all bg-white"
                                        >
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{cheque.farmer_name}</h4>
                                                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">#{cheque.cheque_number}</span>
                                                    <span className={`${new Date(cheque.due_date) <= new Date() ? 'text-rose-600 font-bold' : ''}`}>
                                                        Due: {new Date(cheque.due_date).toLocaleDateString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="font-black text-slate-800 text-lg">
                                                    ₹{cheque.amount.toLocaleString()}
                                                </div>
                                                <button
                                                    onClick={() => handleClearCheque(cheque)}
                                                    disabled={localData.balance < cheque.amount}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                        localData.balance < cheque.amount
                                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                            : "bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-emerald-200"
                                                    }`}
                                                >
                                                    {localData.balance < cheque.amount ? 'No Cash' : 'Clear Now'}
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                                            <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                                            <p className="font-medium">All caught up! No pending cheques.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: RECEIVE MONEY */}
                        {activeTab === 'RECEIVE_MONEY' && (
                            <div className="h-full flex flex-col justify-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-300">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ArrowDownLeft className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Receive Payment</h3>
                                    <p className="text-slate-500 text-sm">Record funds received from companies</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payer (Company)</label>
                                        <select 
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            value={selectedCompany}
                                            onChange={(e) => setSelectedCompany(e.target.value)}
                                        >
                                            <option value="">Select Company</option>
                                            {localData.companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl font-black text-lg text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleReceive}
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-4"
                                    >
                                        {isSubmitting ? "Processing..." : "Confirm Receipt"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}