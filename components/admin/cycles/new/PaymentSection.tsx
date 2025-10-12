// components/admin/cycles/new/PaymentSection.tsx
"use client";

import { IndianRupee } from 'lucide-react';

type Props = {
  totalCost: number;
  initialSeedPrice: number;
};

export default function PaymentSection({ totalCost, initialSeedPrice }: Props) {
  // Format the currency for display
  const formattedCost = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(totalCost);

  const bags = initialSeedPrice > 0 ? Math.round(totalCost / initialSeedPrice) : 0;

  return (
    <div className="form-section-card" style={{ background: 'rgba(255, 218, 214, 0.25)' }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-error-container p-3 rounded-m3-large shadow-sm">
          <IndianRupee className="h-6 w-6 text-on-error-container" />
        </div>
        <h2 className="text-2xl font-normal text-on-surface">Payment Details</h2>
      </div>

      {/* Hidden input to pass the total_cost to the Server Action */}
      <input type="hidden" name="total_cost" value={totalCost} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label className="form-label">Total Seed Cost</label>
          <p className="text-4xl font-light text-on-surface">{formattedCost}</p>
          {bags > 0 && (
            <p className="text-xs text-on-surface-variant">
                ({bags} bags @ ₹{initialSeedPrice.toFixed(2)}/bag)
            </p>
          )}
        </div>
        <div className="h-full flex flex-col justify-center">
          <label className="form-label mb-3">Payment Status</label>
          <div className="flex gap-8">
            <div className="flex items-center">
              <input 
                id="paid" 
                name="payment_status" 
                type="radio" 
                value="Paid"
                className="h-5 w-5 text-primary border-outline/40 focus:ring-primary" 
                defaultChecked 
              />
              <label htmlFor="paid" className="ml-3 block text-on-surface text-base">Paid</label>
            </div>
            <div className="flex items-center">
              <input 
                id="credit" 
                name="payment_status" 
                type="radio" 
                value="Credit"
                className="h-5 w-5 text-primary border-outline/40 focus:ring-primary" 
              />
              <label htmlFor="credit" className="ml-3 block text-on-surface text-base">Credit</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}