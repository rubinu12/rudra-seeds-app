"use client";

import { useState } from 'react';

// LEGACY COMPONENTS (With Modern Polish)
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import Sidebar from "@/components/admin/Sidebar"; // Your original Sidebar

// DATA CARDS
import CyclePipelineCard from '@/components/admin/harvesting/CyclePipelineCard';
import CriticalAlertsCard from '@/components/admin/harvesting/CriticalAlertsCard';
import FinancialOverviewCard from '@/components/admin/harvesting/FinancialOverviewCard';
import ShipmentSummaryCard from '@/components/admin/harvesting/ShipmentSummaryCard';

// MODALS
import SampleEntryModal from '@/components/admin/harvesting/SampleEntryModal';
import SetTemporaryPriceModal from '@/components/admin/harvesting/SetTemporaryPriceModal';
import VerifyPriceModal from '@/components/admin/harvesting/VerifyPriceModal';
import SelectShipmentBillModal from '@/components/admin/harvesting/SelectShipmentBillModal';
import SelectPaymentCycleModal from '@/components/admin/harvesting/SelectPaymentCycleModal';
import FinanceActionModal from '@/components/admin/finance/FinanceActionModal';

// Mock Data
const MOCK_DATA = {
  pipeline: {
    total: { harvested: 1240, sampled: 850, priced: 620, weighed: 450 },
    last24Hours: { harvested: 120, sampled: 45, priced: 30, weighed: 15 }
  },
  alerts: { pricedOver12DaysNotWeighed: 12, weighedNotLoaded: 5 },
  finance: {
    payments: { pending: 42, given: 1205 },
    cheques: { dueTodayCount: 8, dueTodayAmount: 450000 }
  },
  shipments: {
    chequesToVerifyCount: 3,
    shipments: [
      { id: 1, destinationCompany: "Raghuvir Cotex", totalValueSent: 1200000, totalPaymentReceived: 0 }
    ]
  }
};

export default function HarvestView() {
  const [isSampleModalOpen, setSampleModalOpen] = useState(false);
  const [isTempPriceModalOpen, setTempPriceModalOpen] = useState(false);
  const [isVerifyPriceModalOpen, setVerifyPriceModalOpen] = useState(false);
  const [isShipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isFinanceModalOpen, setFinanceModalOpen] = useState(false);

  const handleEditCycle = () => console.log("Edit Cycle");

  return (
    <div className="max-w-[1920px] mx-auto space-y-8 animate-fadeIn">
      
      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN (2/3): Header + Cards */}
        <div className="xl:col-span-2 space-y-10">
           
           {/* 1. MODERN HEADER */}
           <WelcomeHeader 
              activeSeason="Harvesting"
              onEnterSampleDataClick={() => setSampleModalOpen(true)}
              onSetTemporaryPriceClick={() => setTempPriceModalOpen(true)}
              onVerifyPriceClick={() => setVerifyPriceModalOpen(true)}
              onEditCycleClick={handleEditCycle}
              onGenerateShipmentBillClick={() => setShipmentModalOpen(true)}
              onProcessFarmerPaymentsClick={() => setPaymentModalOpen(true)}
              onFinanceClick={() => setFinanceModalOpen(true)}
           />

           {/* 2. DATA CARDS GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CyclePipelineCard data={MOCK_DATA.pipeline} />
              <CriticalAlertsCard data={MOCK_DATA.alerts} />
              <FinancialOverviewCard data={MOCK_DATA.finance} />
              <ShipmentSummaryCard data={MOCK_DATA.shipments} />
           </div>
        </div>

        {/* RIGHT COLUMN (1/3): SIDEBAR */}
        <div className="xl:col-span-1 sticky top-6">
           <Sidebar />
        </div>

      </div>

      {/* MODALS */}
      <SampleEntryModal isOpen={isSampleModalOpen} onClose={() => setSampleModalOpen(false)} cycles={[]} />
      <SetTemporaryPriceModal isOpen={isTempPriceModalOpen} onClose={() => setTempPriceModalOpen(false)} cycles={[]} />
      <VerifyPriceModal isOpen={isVerifyPriceModalOpen} onClose={() => setVerifyPriceModalOpen(false)} cycles={[]} onRefresh={async () => {}} isRefreshing={false} />
      <SelectShipmentBillModal isOpen={isShipmentModalOpen} onClose={() => setShipmentModalOpen(false)} shipments={[]} isLoading={false} />
      <SelectPaymentCycleModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} cycles={[]} isLoading={false} />
      <FinanceActionModal isOpen={isFinanceModalOpen} onClose={() => setFinanceModalOpen(false)} wallets={[]} companies={[]} />
    </div>
  );
}