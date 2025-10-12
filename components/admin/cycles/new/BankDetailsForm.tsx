// components/admin/cycles/new/BankDetailsForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { FarmerDetails } from '@/lib/definitions';
import { Landmark, PlusCircle } from 'lucide-react';

type Props = {
  farmer: FarmerDetails | null;
};

export default function BankDetailsForm({ farmer }: Props) {
  // State to track if we are in "add new account" mode
  const [isAddingNew, setIsAddingNew] = useState(false);
  const hasExistingAccounts = farmer && farmer.bank_accounts.length > 0;

  // When a new farmer is selected, determine the initial state.
  // If the new farmer has no accounts, immediately show the "add new" form.
  useEffect(() => {
    setIsAddingNew(!hasExistingAccounts);
  }, [farmer, hasExistingAccounts]);

  // Don't render this component if no farmer is selected yet
  if (!farmer) {
    return null;
  }

  return (
    <div className="form-section-card" style={{ background: 'rgba(232, 222, 248, 0.25)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-secondary-container p-3 rounded-m3-large shadow-sm">
            <Landmark className="h-6 w-6 text-on-secondary-container" />
          </div>
          <h2 className="text-2xl font-normal text-on-surface">Bank Details</h2>
        </div>
        {/* Show the "Add New" button only if there are existing accounts to choose from */}
        {hasExistingAccounts && !isAddingNew && (
            <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="btn px-4 py-2 font-medium rounded-m3-full text-secondary-container-dark bg-secondary-container/60 hover:bg-secondary-container flex items-center gap-2 text-sm"
            >
                <PlusCircle className="h-4 w-4" />
                Add New
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {(hasExistingAccounts && !isAddingNew) ? (
            <>
                {/* SELECT EXISTING ACCOUNT MODE */}
                <div className="md:col-span-2">
                    <label htmlFor="account_id" className="form-label">Select Bank Account</label>
                    <div className="relative">
                        <select id="account_id" name="account_id" className="form-select">
                            <option value="">Select an account...</option>
                            {farmer.bank_accounts.map((acc) => (
                                <option key={acc.account_id} value={acc.account_id}>
                                    {acc.account_name} - (...{acc.account_no.slice(-4)})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant pointer-events-none" />
                    </div>
                </div>
            </>
        ) : (
            <>
                {/* ADD NEW ACCOUNT FORM MODE */}
                <div>
                    <label htmlFor="account_name" className="form-label">Bank Account Name</label>
                    <input type="text" id="account_name" name="account_name" className="form-input" defaultValue={farmer.name} required />
                </div>
                <div>
                    <label htmlFor="account_no" className="form-label">Account No.</label>
                    <input type="text" id="account_no" name="account_no" className="form-input" required />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="ifsc_code" className="form-label">IFSC Code</label>
                    <input type="text" id="ifsc_code" name="ifsc_code" className="form-input" required />
                </div>
            </>
        )}
      </div>
    </div>
  );
}

// A placeholder for the ChevronDown icon to avoid breaking the code
const ChevronDown = ({ className }: { className: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>;