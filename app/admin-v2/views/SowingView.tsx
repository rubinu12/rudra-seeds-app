"use client";

import React from 'react';
import { useAdmin } from '@/components/admin-v2/AdminProvider';
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import KeyMetrics from "@/components/admin/KeyMetrics";
import { PlusCircle, Sprout } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SowingView() {
  const { seasonLabel } = useAdmin();
  const router = useRouter();

  // Navigate to the full-page form instead of nesting it
  const handleStartNewCycle = () => {
    router.push('/admin/cycles/new');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header with Sowing-specific context */}
      <WelcomeHeader 
        activeSeason="Sowing"
        onEnterSampleDataClick={() => { } }
        onSetTemporaryPriceClick={() => { } }
        onVerifyPriceClick={() => { } }
        onEditCycleClick={() => { } }
        // The "Finance" button or a custom action can trigger the new cycle flow
        onFinanceClick={handleStartNewCycle} onGenerateShipmentBillClick={function (): void {
          throw new Error('Function not implemented.');
        } } onProcessFarmerPaymentsClick={function (): void {
          throw new Error('Function not implemented.');
        } }      />

      {/* 2. Main Action Card for Sowing */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
            <Sprout className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Start New Sowing Cycle</h2>
            <p className="text-gray-500 text-sm">Register farmers and distribute seeds for {seasonLabel}</p>
          </div>
        </div>
        <button 
          onClick={handleStartNewCycle}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Cycle
        </button>
      </div>

      {/* 3. Legacy Metrics Grid */}
      <div className="grid grid-cols-1 gap-6">
        <KeyMetrics />
      </div>

      {/* 4. Sowing List Placeholder */}
      <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
        <p className="text-gray-300 font-medium italic">
          Active Sowing List for {seasonLabel}
        </p>
      </div>
    </div>
  );
}