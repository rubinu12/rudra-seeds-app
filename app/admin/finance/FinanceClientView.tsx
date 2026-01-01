"use client";
import { useState } from 'react';
import { Wallet, Briefcase, PlusCircle } from 'lucide-react';
import FinanceActionModal from '@/components/admin/finance/FinanceActionModal';

export default function FinanceClientView({ ledgers, wallets, companies }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalDue = ledgers.reduce((sum: number, l: any) => sum + l.current_due, 0);
  const totalCash = wallets.reduce((sum: number, w: any) => sum + Number(w.balance), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Finance Hub</h1>
          <p className="text-on-surface-variant">Cash Flow & Receivables</p>
        </div>
        
        {/* SINGLE BUTTON ACTION */}
        <button 
           onClick={() => setIsModalOpen(true)}
           className="px-6 py-3 bg-primary text-on-primary rounded-xl font-medium shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
           <PlusCircle className="w-5 h-5" />
           Manage Finances
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Wallet Card */}
         <div className="bg-surface rounded-3xl p-6 border border-outline/20 shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-[0.03]"><Wallet className="w-40 h-40"/></div>
             <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-1">Cash In Hand</h3>
             <p className="text-4xl font-bold text-primary mb-6">₹{totalCash.toLocaleString()}</p>
             
             <div className="space-y-3">
               {wallets.map((w: any) => (
                  <div key={w.wallet_id} className="flex justify-between items-center p-3 bg-surface-container rounded-xl">
                     <span className="font-medium text-on-surface flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div> {w.wallet_name}
                     </span>
                     <span className="font-mono font-bold">₹{Number(w.balance).toLocaleString()}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Receivables Card */}
         <div className="bg-surface rounded-3xl p-6 border border-outline/20 shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-[0.03]"><Briefcase className="w-40 h-40"/></div>
             <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-1">Total Receivables</h3>
             <p className="text-4xl font-bold text-green-600 mb-6">₹{totalDue.toLocaleString()}</p>
             
             <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-100 text-sm">
                You have pending payments from <strong>{ledgers.filter((l: any) => l.current_due > 0).length}</strong> companies.
             </div>
         </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface rounded-3xl p-6 border border-outline/20 shadow-sm">
         <h3 className="text-lg font-bold mb-4 px-1">Company Accounts (Ledger)</h3>
         <div className="overflow-x-auto rounded-xl border border-outline/10">
            <table className="w-full text-sm text-left">
               <thead className="bg-surface-container text-on-surface-variant">
                  <tr>
                     <th className="p-4">Company Name</th>
                     <th className="p-4 text-right">Total Sent (Shipments)</th>
                     <th className="p-4 text-right">Total Received</th>
                     <th className="p-4 text-right">Current Due</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-outline/10">
                  {ledgers.map((l: any) => (
                     <tr key={l.company_id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="p-4 font-medium text-on-surface">{l.company_name}</td>
                        <td className="p-4 text-right text-on-surface-variant">₹{l.total_shipments_value.toLocaleString()}</td>
                        <td className="p-4 text-right text-green-600 font-medium">₹{l.total_received.toLocaleString()}</td>
                        <td className="p-4 text-right">
                            <span className={`px-3 py-1 rounded-lg font-bold ${l.current_due > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                ₹{l.current_due.toLocaleString()}
                            </span>
                        </td>
                     </tr>
                  ))}
                  {ledgers.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-on-surface-variant">No ledger data available.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Unified Modal */}
      <FinanceActionModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)}
         companies={companies}
         wallets={wallets}
      />
    </div>
  );
}