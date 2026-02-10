"use client";

import React, { useState, useActionState, useMemo, useEffect } from "react";
import { processFarmerPaymentAction } from "@/src/app/admin/payments/actions";
import {
  IndianRupee,
  CreditCard,
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  Wallet,
  Receipt,
  CheckCircle,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { FarmerPaymentDetails } from "@/src/lib/payment-data";
import { useFormStatus } from "react-dom";

// --- Types ---
type ChequeEntry = {
  id: number;
  payee_name: string;
  cheque_number: string;
  amount: string;
  due_date: string; // NEW: Track date per cheque
};

// Helper for consistent formatting across Server/Client
const formatRupee = (amount: number) => {
  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

export default function ProcessPaymentForm({
  paymentDetails,
}: {
  paymentDetails: FarmerPaymentDetails;
}) {
  // Server Action State
  const [state, formAction] = useActionState(processFarmerPaymentAction, {
    message: "",
    success: false,
  });

  // Local States
  const [dueDays, setDueDays] = useState(22);
  const [chequeEntries, setChequeEntries] = useState<ChequeEntry[]>([]);

  // Check Inputs
  const [newPayee, setNewPayee] = useState(paymentDetails.farmer_name);
  const [newChequeNo, setNewChequeNo] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState(""); // NEW: Individual date state

  // --- Calculations ---
  const grossTotal = useMemo(() => {
    return paymentDetails.gross_payment || 0;
  }, [paymentDetails]);

  const netPayable = paymentDetails.net_payment || 0;

  const totalChequeAmount = useMemo(
    () =>
      chequeEntries.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
    [chequeEntries],
  );

  const remainingAmount = netPayable - totalChequeAmount;

  const isMatched = Math.abs(remainingAmount) < 1;

  // --- Effect: Update default cheque date when Due Days changes ---
  // This calculates the 'Suggested Date' for the next cheque
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + dueDays);
    setNewDueDate(date.toISOString().split('T')[0]); // YYYY-MM-DD
  }, [dueDays]);

  // --- Handlers ---
  const handleAddCheque = () => {
    if (!newPayee || !newChequeNo || !newAmount || !newDueDate) return;

    const entry: ChequeEntry = {
      id: Date.now(),
      payee_name: newPayee,
      cheque_number: newChequeNo,
      amount: newAmount,
      due_date: newDueDate, // Save specific date
    };

    setChequeEntries([...chequeEntries, entry]);
    
    // Reset inputs (Keep Payee and Date as they likely remain same for next batch)
    setNewChequeNo("");
    setNewAmount("");
  };

  const removeCheque = (id: number) => {
    setChequeEntries(chequeEntries.filter((c) => c.id !== id));
  };

  const fillRemaining = () => {
    if (remainingAmount > 0) setNewAmount(remainingAmount.toFixed(2));
  };

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
    >
      {/* HIDDEN INPUTS FOR SERVER ACTION */}
      <input
        type="hidden"
        name="cycleId"
        value={paymentDetails.crop_cycle_id}
      />
      <input type="hidden" name="grossPayment" value={grossTotal} />
      <input type="hidden" name="netPayment" value={netPayable} />
      
      {/* We still pass dueDays for legacy record keeping, but logic relies on JSON below */}
      <input type="hidden" name="dueDays" value={dueDays} />
      
      <input
        type="hidden"
        name="cheque_details"
        value={JSON.stringify(chequeEntries)}
      />

      {/* --- LEFT COL: FINANCIAL SUMMARY --- */}
      <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Payment Breakdown
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Calculation Summary
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Gross */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-slate-500 font-medium text-sm">
              Total Goods Value
            </span>
            <span className="font-bold text-slate-900">
              ₹{formatRupee(grossTotal)}
            </span>
          </div>

          {/* Deductions */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-sm">
                Less: Advance / Ded.
              </span>
            </div>
            <span className="font-bold text-red-600">
              - ₹{formatRupee(grossTotal - netPayable)}
            </span>
          </div>

          {/* Net Payable */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <p className="text-slate-400 text-xs font-bold uppercase mb-1">
              Net Payable Amount
            </p>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-5 h-5 text-green-400" />
              <span className="text-3xl font-black tracking-tight">
                {formatRupee(netPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className={isMatched ? "text-green-600" : "text-slate-500"}>
              Cheques Added: ₹{formatRupee(totalChequeAmount)}
            </span>
            <span
              className={
                remainingAmount <= 0.01 ? "text-green-600" : "text-red-500"
              }
            >
              Remaining: ₹{formatRupee(remainingAmount)}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${remainingAmount < 0 ? "bg-red-500" : "bg-green-500"}`}
              style={{
                width: `${Math.min((totalChequeAmount / netPayable) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* --- RIGHT COL: ACTION AREA --- */}
      <div className="lg:col-span-2 space-y-6">
        {/* 1. Payment Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            Payment Terms (Defaults)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Default Due Days
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                  className="w-24 font-bold text-xl p-2 border-b-2 border-slate-200 focus:border-black outline-none bg-transparent"
                />
                <span className="text-sm font-medium text-slate-400">
                  Days from today
                </span>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                Calculated Default Date
              </p>
              <p className="text-sm font-bold text-slate-900">
                {new Date(
                  Date.now() + dueDays * 24 * 60 * 60 * 1000,
                ).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Cheque Entry */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-slate-400" />
            Cheque Details
          </h3>

          {/* Input Row - REDESIGNED to include Date */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">
                Payee Name
              </label>
              <input
                type="text"
                placeholder="Farmer Name"
                value={newPayee}
                onChange={(e) => setNewPayee(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">
                Cheque No.
              </label>
              <input
                type="text"
                placeholder="XXXXXX"
                value={newChequeNo}
                onChange={(e) => setNewChequeNo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-bold font-mono focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            {/* NEW DATE FIELD */}
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">
                Due Date
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1 flex justify-between">
                Amount
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={fillRemaining}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Calculator className="w-3 h-3" /> Auto
                  </button>
                )}
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full pl-9 p-2.5 rounded-lg border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddCheque}
                disabled={!newAmount || !newChequeNo || !newDueDate}
                className="w-full bg-black text-white p-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1 hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Added Cheques List */}
          {chequeEntries.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
              <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-medium">
                No cheques added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {chequeEntries.map((cheque, idx) => (
                <div
                  key={cheque.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {cheque.payee_name}
                      </p>
                      <div className="flex gap-2">
                          <p className="text-xs font-mono text-slate-500">
                            #{cheque.cheque_number}
                          </p>
                          {/* Display Specific Date */}
                          <p className="text-xs font-medium text-blue-600 border border-blue-100 bg-blue-50 px-1 rounded">
                             Due: {new Date(cheque.due_date).toLocaleDateString('en-IN')}
                          </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">
                      ₹{formatRupee(parseFloat(cheque.amount))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCheque(cheque.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Submit Area */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {state?.message && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
            >
              {state.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {state.message}
            </div>
          )}

          {/* Error List */}
          {state?.errors && (
            <div className="text-red-500 text-xs space-y-1 text-center">
              {Object.values(state.errors)
                .flat()
                .map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
            </div>
          )}

          <SubmitButton isDisabled={!isMatched || chequeEntries.length === 0} />
        </div>
      </div>
    </form>
  );
}

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={isDisabled || pending}
      className={`
                w-full md:w-auto min-w-[250px] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl transition-all
                ${
                  isDisabled
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] shadow-green-200"
                }
            `}
    >
      {pending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Save className="w-5 h-5" />
      )}
      {pending ? "Processing Payment..." : "Confirm & Generate Cheques"}
    </button>
  );
}