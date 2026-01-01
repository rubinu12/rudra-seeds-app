"use client";
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/FormInputs';
import { useActionState } from 'react';
import { receiveCompanyPayment, setWalletBalance } from '@/app/admin/finance/actions';
import { Save, LoaderCircle, ArrowDownLeft, Settings, RefreshCcw } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companies: { id: number; name: string }[];
  wallets: { id: number; name: string }[];
};

export default function FinanceActionModal({ isOpen, onClose, companies, wallets }: Props) {
  // Toggle State: 'receive' or 'adjust'
  const [mode, setMode] = useState<'receive' | 'adjust'>('receive');

  // We need TWO action states because they are different server actions
  const [receiveState, receiveAction, isReceivePending] = useActionState(receiveCompanyPayment, { message: '', success: false });
  const [adjustState, adjustAction, isAdjustPending] = useActionState(setWalletBalance, { message: '', success: false });

  // Close modal on success from EITHER action
  useEffect(() => {
    if ((receiveState.success || adjustState.success) && isOpen) {
        const timer = setTimeout(() => {
            onClose();
            // Reset states implicitly by unmounting or you could add reset logic
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [receiveState.success, adjustState.success, isOpen, onClose]);

  const companyOptions = companies.map(c => ({ value: String(c.id), label: c.name }));
  const walletOptions = wallets.map(w => ({ value: String(w.id), label: w.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finance Manager">
      
      {/* 1. The Toggle Switch */}
      <div className="flex bg-surface-container rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('receive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'receive' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
            }`}
          >
              <ArrowDownLeft className="w-4 h-4" /> Receive Payment
          </button>
          <button
            onClick={() => setMode('adjust')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'adjust' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
            }`}
          >
              <Settings className="w-4 h-4" /> Adjust Balance
          </button>
      </div>

      {/* 2. Form Container */}
      {mode === 'receive' ? (
          <form action={receiveAction} className="space-y-4 animate-fadeIn">
            <Select label="Payer (Seed Company)" name="companyId" options={companyOptions} required />
            <Input label="Amount Received (₹)" name="amount" type="number" required />
            <Select label="Deposit To" name="walletId" options={walletOptions} required />
            
            <div className="grid grid-cols-2 gap-4">
                <Select label="Mode" name="mode" options={[{value: 'RTGS', label: 'RTGS/NEFT'}, {value: 'Cheque', label: 'Cheque'}, {value: 'Cash', label: 'Cash'}]} required />
                <Input label="Reference No." name="reference" type="text" placeholder="UTR / Cheque No" />
            </div>

            {receiveState.message && (
                <p className={`text-center text-sm font-medium ${receiveState.success ? 'text-green-600' : 'text-error'}`}>{receiveState.message}</p>
            )}

            <button type="submit" disabled={isReceivePending} className="w-full bg-green-600 text-white py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-green-700 disabled:opacity-70">
                {isReceivePending ? <LoaderCircle className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                Confirm Receipt
            </button>
          </form>
      ) : (
          <form action={adjustAction} className="space-y-4 animate-fadeIn">
             <div className="p-3 bg-primary-container/30 rounded-lg text-xs text-on-surface-variant flex gap-2">
                <RefreshCcw className="w-4 h-4 shrink-0" />
                Use this to manually correct the balance if the system data doesn't match your actual bank/cash balance.
             </div>

             <Select label="Select Wallet to Correct" name="walletId" options={walletOptions} required />
             <Input label="New Actual Balance (₹)" name="newBalance" type="number" required />

             {adjustState.message && (
                <p className={`text-center text-sm font-medium ${adjustState.success ? 'text-green-600' : 'text-error'}`}>{adjustState.message}</p>
            )}

             <button type="submit" disabled={isAdjustPending} className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:bg-primary/90 disabled:opacity-70">
                {isAdjustPending ? <LoaderCircle className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                Update Balance
            </button>
          </form>
      )}
    </Modal>
  );
}