// components/admin/harvesting/FinancialOverviewCard.tsx
"use client";

import { useState } from 'react';
import { FinancialOverviewData } from '@/lib/admin-data'; // Import the type
import { IndianRupee, Landmark } from 'lucide-react'; // Using Landmark as a placeholder for Cheque icon

type Props = {
  data: FinancialOverviewData;
};

type Tab = 'payments' | 'cheques';

export default function FinancialOverviewCard({ data }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('payments');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-surface-container rounded-3xl p-6 shadow-sm">
      <h3 className="text-xl font-medium text-on-surface mb-1">Financial Overview</h3>

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-outline/30 mb-5">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => setActiveTab('cheques')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'cheques'
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Cheques
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'payments' && (
          <div className="space-y-4">
             <FinancialItem label="Final Payment Pending" value={data.payments.pending} />
             <FinancialItem label="Final Payment Given" value={data.payments.given} />
          </div>
        )}

        {activeTab === 'cheques' && (
          <div className="space-y-4">
             <FinancialItem label="Cheques Due Today" value={data.cheques.dueTodayCount} />
             <FinancialItem label="Total Amount Due Today" value={formatCurrency(data.cheques.dueTodayAmount)} icon={IndianRupee} />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for displaying financial items
const FinancialItem = ({ label, value, icon: Icon }: { label: string, value: string | number, icon?: React.ElementType }) => (
  <div className="flex justify-between items-center">
    <p className="text-sm text-on-surface-variant">{label}</p>
    <div className="flex items-center gap-1">
       {Icon && <Icon className="w-4 h-4 text-on-surface" strokeWidth={2} />}
       <p className="text-lg font-semibold text-on-surface">{value}</p>
    </div>
  </div>
);