"use client";

import { useState, useEffect } from 'react';
import { FarmerDetails } from '@/lib/definitions';
import { Landmark, PlusCircle, ChevronDown } from 'lucide-react';

function Input(props: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  const { id, label, className, ...rest } = props;
  return (
    // FIX: Added background color
    <div className={`relative bg-input-bg/80 border border-outline rounded-lg h-14 focus-within:border-primary focus-within:border-2 ${className}`}>
      <input id={id} className="w-full h-full pt-5 px-4 bg-transparent outline-none text-on-surface peer" placeholder=" " {...rest} />
      <label htmlFor={id} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-primary peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:text-xs">{label}</label>
    </div>
  );
}

function Select(props: React.ComponentPropsWithoutRef<'select'> & { label: string }) {
    const { id, label, children, className, ...rest } = props;
    return (
        // FIX: Added background color
        <div className={`relative bg-input-bg/80 border border-outline rounded-lg h-14 focus-within:border-primary focus-within:border-2 ${className}`}>
            <select id={id} className="w-full h-full pt-5 px-4 bg-transparent outline-none text-on-surface peer appearance-none" {...rest}>{children}</select>
            <label htmlFor={id} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-primary peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:text-xs">{label}</label>
            <div className="absolute top-0 right-0 h-full flex items-center px-4 pointer-events-none"><ChevronDown className="h-5 w-5 text-on-surface-variant" /></div>
        </div>
    );
}

type Props = { farmer: FarmerDetails | null; };

export default function BankDetailsForm({ farmer }: Props) {
  const [isAddingNew, setIsAddingNew] = useState(true);
  const hasExistingAccounts = farmer && farmer.bank_accounts.length > 0;

  useEffect(() => { setIsAddingNew(!hasExistingAccounts); }, [farmer, hasExistingAccounts]);
  
  return (
    // FIX: Added background color
    <div className="bg-surface-container rounded-m3-xlarge p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 grid place-items-center rounded-2xl bg-secondary-container">
          <Landmark className="w-6 h-6 text-on-secondary-container" />
        </div>
        <h2 className="text-3xl font-normal text-on-surface">Bank Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(hasExistingAccounts && !isAddingNew) ? (
          <>
            <div className="md:col-span-2"><Select id="account_id" name="account_id" label="Select Existing Bank Account">
                <option value="">Select an account...</option>
                {farmer.bank_accounts.map((acc) => (<option key={acc.account_id} value={acc.account_id}>{acc.account_name} - (...{acc.account_no.slice(-4)})</option>))}
            </Select></div>
            <div className="md:col-span-2 flex justify-end -mt-2"><button type="button" onClick={() => setIsAddingNew(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-m3-full text-primary border border-outline hover:bg-primary/10"><PlusCircle className="h-4 w-4" /> Add Another Account</button></div>
          </>
        ) : (
          <>
            <Input id="account_name" name="account_name" label="Name in Bank Account" defaultValue={farmer?.name} key={`acc-name-${farmer?.farmer_id}`} required />
            <Input id="account_name_confirm" name="account_name_confirm" label="Confirm Name" defaultValue={farmer?.name} key={`acc-name-confirm-${farmer?.farmer_id}`} required />
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input id="account_no" name="account_no" label="Bank Account No." key={`acc-no-${farmer?.farmer_id}`} required />
                <Input id="ifsc" name="ifsc_code" label="IFSC Code" key={`ifsc-${farmer?.farmer_id}`} required />
                <Input id="bankName" name="bank_name" label="Bank Name" key={`bank-name-${farmer?.farmer_id}`} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}