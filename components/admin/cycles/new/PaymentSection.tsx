// components/admin/cycles/new/PaymentSection.tsx
"use client";

import { Save, X } from 'lucide-react';

type Props = { totalCost: number; initialSeedPrice: number; };

export default function PaymentSection({ totalCost, initialSeedPrice }: Props) {
  const formattedCost = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(totalCost);

  const bags = initialSeedPrice > 0 ? Math.round(totalCost / initialSeedPrice) : 0;

  return (
    // FINAL FIX: This card now contains everything for the final sidebar section.
    <div className="bg-surface-container rounded-m3-xlarge p-6 shadow-sm">
      <input type="hidden" name="total_cost" value={totalCost} />

      <div className="text-left mb-6">
        <p className="text-base text-on-surface-variant">Total Amount</p>
        <p className="text-5xl font-light text-on-surface leading-tight mt-1">{formattedCost}</p>
        {bags > 0 && (
          <p className="text-sm text-on-surface-variant mt-1">
              ({bags} bags @ ₹{initialSeedPrice.toFixed(2)}/bag)
          </p>
        )}
      </div>
      
      <div className="mb-8">
        <div className="flex gap-8">
            <label htmlFor="paid" className="flex items-center cursor-pointer">
              <input id="paid" name="payment_status" type="radio" value="Paid" className="peer sr-only" defaultChecked />
              <span className="w-5 h-5 border-2 border-outline rounded-full grid place-items-center peer-checked:border-primary"><span className="w-2.5 h-2.5 rounded-full bg-primary transform scale-0 peer-checked:scale-100 transition-transform"></span></span>
              <span className="ml-2 text-on-surface">Paid</span>
            </label>
            <label htmlFor="credit" className="flex items-center cursor-pointer">
              <input id="credit" name="payment_status" type="radio" value="Credit" className="peer sr-only" />
              <span className="w-5 h-5 border-2 border-outline rounded-full grid place-items-center peer-checked:border-primary"><span className="w-2.5 h-2.5 rounded-full bg-primary transform scale-0 peer-checked:scale-100 transition-transform"></span></span>
              <span className="ml-2 text-on-surface">Credit</span>
            </label>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button type="submit" className="flex items-center justify-center w-full h-12 text-base font-medium rounded-m3-full text-on-primary bg-primary hover:shadow-lg transition-shadow">
            Save & Create Cycle
        </button>
        <button type="button" className="flex items-center justify-center w-full h-12 text-base font-medium rounded-m3-full text-primary border border-outline hover:bg-primary/10">
            Cancel
        </button>
      </div>
    </div>
  );
}