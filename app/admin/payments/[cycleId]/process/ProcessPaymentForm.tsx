// app/admin/payments/[cycleId]/process/ProcessPaymentForm.tsx
"use client";

import React, { useState, useEffect, useMemo, useActionState, useTransition } from 'react';
import type { FarmerPaymentDetails } from '@/lib/payment-data';
import type { BankAccount } from '@/lib/definitions';
import { Input } from '@/components/ui/FormInputs'; // Make sure Input is imported
// Placeholder for the actual action import
import { processFarmerPaymentAction, ProcessPaymentFormState } from '@/app/admin/payments/actions'; // Adjust path if needed
import { IndianRupee, MinusCircle, Banknote, Hash, CheckCircle, AlertCircle, LoaderCircle, Save, CalendarDays } from 'lucide-react'; // Added CalendarDays

type ProcessPaymentFormProps = {
    paymentDetails: FarmerPaymentDetails;
};

// Type for managing state of individual cheque entries
type ChequeEntry = {
    accountId: number;
    accountName: string; // Payee Name
    chequeNumber: string;
    amount: string; // Store as string for input control
};

const initialProcessState: ProcessPaymentFormState = { message: '', success: false };

export default function ProcessPaymentForm({ paymentDetails }: ProcessPaymentFormProps) {
    // State to hold the details for each cheque being generated
    const [chequeEntries, setChequeEntries] = useState<ChequeEntry[]>([]);
    // State to track which bank accounts are selected for payment
    const [selectedAccountIds, setSelectedAccountIds] = useState<Set<number>>(new Set());
    
    // *** ADD NEW STATE for Due Days ***
    const [dueDays, setDueDays] = useState('22'); // Default to 22

    const [state, formAction] = useActionState(processFarmerPaymentAction, initialProcessState);
    const [isPending, startTransition] = useTransition();

    // ... (useMemo calculations for totalChequeAmount, amountsMatch, canSubmit remain the same) ...
    const totalChequeAmount = useMemo(() => {
        return chequeEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
    }, [chequeEntries]);
    const amountsMatch = useMemo(() => {
        return Math.abs(totalChequeAmount - paymentDetails.net_payment) < 0.01;
    }, [totalChequeAmount, paymentDetails.net_payment]);
    const canSubmit = !isPending && amountsMatch && paymentDetails.net_payment > 0 && chequeEntries.length > 0;


    // ... (handleAccountSelection and handleChequeInputChange remain the same) ...
    const handleAccountSelection = (account: BankAccount, isSelected: boolean) => {
        setSelectedAccountIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(account.account_id);
            } else {
                newSet.delete(account.account_id);
            }
            return newSet;
        });

        if (isSelected) {
            setChequeEntries(prev => [
                ...prev,
                { accountId: account.account_id, accountName: account.account_name, chequeNumber: '', amount: '' }
            ]);
        } else {
            setChequeEntries(prev => prev.filter(entry => entry.accountId !== account.account_id));
        }
    };
    const handleChequeInputChange = (accountId: number, field: 'chequeNumber' | 'amount', value: string) => {
        let sanitizedValue = value;
        if (field === 'amount') {
            sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        } else {
             sanitizedValue = value;
        }

        setChequeEntries(prev =>
            prev.map(entry =>
                entry.accountId === accountId ? { ...entry, [field]: sanitizedValue } : entry
            )
        );
    };


    // Prepare data and submit the form
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;

        const formData = new FormData();
        formData.append('cycleId', String(paymentDetails.crop_cycle_id));
        formData.append('grossPayment', String(paymentDetails.gross_payment.toFixed(2)));
        formData.append('netPayment', String(paymentDetails.net_payment.toFixed(2)));
        
        // *** ADD dueDays to formData ***
        formData.append('dueDays', dueDays);

        // Prepare cheque_details JSON
        const chequeDetailsForAction = chequeEntries.map(entry => ({
            payee_name: entry.accountName,
            cheque_number: entry.chequeNumber,
            amount: parseFloat(entry.amount) || 0,
            // due_date will be calculated in the action
        }));
        formData.append('cheque_details', JSON.stringify(chequeDetailsForAction));

        startTransition(() => {
            formAction(formData);
        });
    };

     // ... (useEffect for success state remains the same) ...
     useEffect(() => {
        if (state.success) {
            // This alert will likely not be seen due to the redirect in the action
            alert('Payment processed and details saved! Redirecting to print...');
        }
    }, [state.success, paymentDetails.crop_cycle_id]);


    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* --- Calculation Summary (Unchanged) --- */}
            <section className="bg-surface-container rounded-xl p-4 border border-outline/20">
                {/* ... (existing gross, deduction, net payment display) ... */}
                <h2 className="text-lg font-medium text-primary mb-3 border-b pb-2">Payment Calculation</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-surface p-3 rounded">
                        <p className="text-xs text-on-surface-variant">Gross Payment</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(paymentDetails.gross_payment)}</p>
                        <p className="text-xs text-on-surface-variant">({paymentDetails.quantity_in_bags} Bags @ ₹{paymentDetails.purchase_rate.toFixed(2)}/Man)</p>
                    </div>
                    <div className="bg-surface p-3 rounded">
                        <p className="text-xs text-on-surface-variant">Seed Cost Deduction</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(paymentDetails.amount_remaining)}</p>
                        <p className="text-xs text-on-surface-variant">(Remaining from initial purchase)</p>
                    </div>
                    <div className="bg-primary-container p-3 rounded">
                        <p className="text-xs text-on-primary-container font-medium">Net Payment Due</p>
                        <p className="text-xl font-bold text-on-primary-container">{formatCurrency(paymentDetails.net_payment)}</p>
                        <p className="text-xs text-on-primary-container">(Gross - Deduction)</p>
                    </div>
                </div>
            </section>

             {/* --- Bank Account Selection & Cheque Entry --- */}
             <section className="bg-surface-container rounded-xl p-4 border border-outline/20">
                <h2 className="text-lg font-medium text-primary mb-3 border-b pb-2">Generate Cheque(s)</h2>
                <p className="text-sm text-on-surface-variant mb-3">Select the bank account(s) to issue cheque(s) for. The total amount must equal the Net Payment Due.</p>

                {/* *** ADD Due Days Input *** */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                    <div className="md:col-span-1">
                        <Input
                            id="dueDays"
                            name="dueDays"
                            label="Cheque Due Days"
                            type="number"
                            min="0"
                            value={dueDays}
                            onChange={(e) => setDueDays(e.target.value.replace(/\D/g, ''))} // Allow only non-negative integers
                            required
                            disabled={isPending}
                        />
                    </div>
                    <p className="md:col-span-2 text-xs text-on-surface-variant pb-2">
                        Enter the number of days from today that the cheque(s) will be due (e.g., 22).
                    </p>
                </div>
                {/* *** END Add Due Days Input *** */}


                {/* Bank Account List (Unchanged) */}
                 <div className="space-y-2 mb-4 max-h-40 overflow-y-auto border rounded p-2 bg-surface">
                     {/* ... (existing bank account mapping) ... */}
                     {paymentDetails.bank_accounts.length > 0 ? paymentDetails.bank_accounts.map(account => (
                         <label key={account.account_id} className="flex items-center p-2 rounded hover:bg-primary/5 cursor-pointer">
                             <input
                                 type="checkbox"
                                 className="h-4 w-4 rounded text-primary border-outline focus:ring-primary mr-3"
                                 checked={selectedAccountIds.has(account.account_id)}
                                 onChange={(e) => handleAccountSelection(account, e.target.checked)}
                                 disabled={isPending}
                             />
                             <span className="text-sm font-medium text-on-surface">{account.account_name}</span>
                             <span className="text-xs text-on-surface-variant ml-2 truncate">({account.bank_name} - ****{String(account.account_no).slice(-4)})</span>
                         </label>
                     )) : (
                        <p className='text-sm text-center text-on-surface-variant py-2'>No bank accounts found for this farmer.</p>
                     )}
                 </div>

                 {/* Cheque Entry Forms (Unchanged) */}
                 {chequeEntries.length > 0 && (
                    <div className="space-y-4 border-t pt-4">
                        {/* ... (existing chequeEntries.map) ... */}
                        <h3 className="text-md font-medium text-on-surface-variant">Enter Cheque Details:</h3>
                        {chequeEntries.map((entry, index) => (
                            <div key={entry.accountId} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-surface p-3 rounded border">
                                <div className="md:col-span-2">
                                     <p className="text-xs text-on-surface-variant mb-1">Payee</p>
                                     <p className="text-sm font-medium text-on-surface truncate">{entry.accountName}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        id={`chequeNumber_${entry.accountId}`}
                                        name={`chequeNumber_${entry.accountId}`}
                                        label="Cheque Number"
                                        value={entry.chequeNumber}
                                        onChange={(e) => handleChequeInputChange(entry.accountId, 'chequeNumber', e.target.value)}
                                        required
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        id={`amount_${entry.accountId}`}
                                        name={`amount_${entry.accountId}`}
                                        label="Amount (₹)"
                                        type="number"
                                        step="0.01"
                                        value={entry.amount}
                                        onChange={(e) => handleChequeInputChange(entry.accountId, 'amount', e.target.value)}
                                        required
                                        disabled={isPending}
                                        min="0.01"
                                     />
                                </div>
                            </div>
                        ))}
                    </div>
                 )}

                 {/* Amount Check (Unchanged) */}
                 {chequeEntries.length > 0 && (
                     <div className={`mt-4 p-2 rounded text-center text-sm font-medium flex items-center justify-center gap-2 ${amountsMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {amountsMatch ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                         Total Cheque Amount: {formatCurrency(totalChequeAmount)} / {formatCurrency(paymentDetails.net_payment)} Required
                    </div>
                 )}
            </section>

             {/* --- Submit Button & Feedback (Unchanged) --- */}
             <div className="pt-4 flex flex-col items-center">
                {/* ... (existing submit button and error display) ... */}
                <button
                    type="submit"
                    className="btn bg-primary text-on-primary px-8 py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canSubmit || isPending}
                >
                    {isPending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isPending ? 'Processing...' : 'Confirm & Generate Cheques'}
                </button>
                 {state?.message && !state.success && (
                    <p className="mt-3 text-sm font-medium text-error">
                         {state.message}
                     </p>
                 )}
                  {state?.errors && Object.entries(state.errors).map(([field, errors]) => (
                      errors && errors.length > 0 && ( <p key={field} className="mt-1 text-xs text-error">{field}: {errors.join(', ')}</p> )
                  ))}
            </div>

        </form>
    );
}