"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/components/admin-v2/AdminProvider';

// ACTIONS
import { getDashboardStats, DashboardStats } from '@/app/admin/actions/dashboard';
import { getCyclesPendingSampleEntry, CycleForSampleEntry } from '@/app/admin/actions/sample-actions';
import { getCyclesPendingTempPrice, getCyclesPendingVerification, CycleForPriceApproval } from '@/app/admin/actions/pricing-actions';

// COMPONENTS
import WelcomeHeader from "@/components/admin/WelcomeHeader";
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

export default function HarvestView() {
  const { year } = useAdmin();
  
  // --- Dashboard Stats State ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // --- Sample Modal State ---
  const [isSampleModalOpen, setSampleModalOpen] = useState(false);
  const [sampleCycles, setSampleCycles] = useState<CycleForSampleEntry[]>([]);
  const [isSampleRefreshing, setIsSampleRefreshing] = useState(false);

  // --- Temporary Price Modal State ---
  const [isTempPriceModalOpen, setTempPriceModalOpen] = useState(false);
  const [tempPriceCycles, setTempPriceCycles] = useState<CycleForPriceApproval[]>([]);
  const [isTempRefreshing, setIsTempRefreshing] = useState(false);

  // --- Verify Price Modal State ---
  const [isVerifyPriceModalOpen, setVerifyPriceModalOpen] = useState(false);
  const [verifyCycles, setVerifyCycles] = useState<any[]>([]);
  const [isVerifyRefreshing, setIsVerifyRefreshing] = useState(false);

  // --- Other Modals State ---
  const [isShipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isFinanceModalOpen, setFinanceModalOpen] = useState(false);

  const CACHE_KEY = `harvest_stats_${year}`;

  // --- 1. Fetch Dashboard Stats (Memory Caching) ---
  const fetchDashboardStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsStatsLoading(true);
    try {
      const freshData = await getDashboardStats(year, 'Harvesting');
      setStats(freshData);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [year, CACHE_KEY]);

  // --- 2. Fetch Sample Cycles ---
  const handleFetchSampleCycles = useCallback(async () => {
    setIsSampleRefreshing(true);
    try {
      const data = await getCyclesPendingSampleEntry();
      setSampleCycles(data);
    } catch (error) {
      console.error("Sample Fetch Error:", error);
    } finally {
      setIsSampleRefreshing(false);
    }
  }, []);

  // --- 3. Fetch Temporary Price Cycles ---
  const handleFetchTempPriceCycles = useCallback(async () => {
    setIsTempRefreshing(true);
    try {
      const data = await getCyclesPendingTempPrice();
      setTempPriceCycles(data);
    } catch (error) {
      console.error("Temp Price Fetch Error:", error);
    } finally {
      setIsTempRefreshing(false);
    }
  }, []);

  // --- 4. Fetch Verify Price Cycles ---
  const handleFetchVerifyCycles = useCallback(async () => {
    setIsVerifyRefreshing(true);
    try {
      const data = await getCyclesPendingVerification();
      setVerifyCycles(data);
    } catch (error) {
      console.error("Verify Price Fetch Error:", error);
    } finally {
      setIsVerifyRefreshing(false);
    }
  }, []);

  // Initialize Page Data
  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      setStats(JSON.parse(cached));
      fetchDashboardStats(true); // Silent background update
    } else {
      fetchDashboardStats(false);
    }
    
    // Background update every 30 minutes
    const interval = setInterval(() => fetchDashboardStats(true), 1800000);
    return () => clearInterval(interval);
  }, [CACHE_KEY, fetchDashboardStats]);

  // Modal Open Handlers with "Show then Refresh" strategy
  const handleOpenSampleModal = () => {
    setSampleModalOpen(true);
    if (sampleCycles.length === 0) handleFetchSampleCycles();
    else getCyclesPendingSampleEntry().then(setSampleCycles);
  };

  const handleOpenTempPriceModal = () => {
    setTempPriceModalOpen(true);
    if (tempPriceCycles.length === 0) handleFetchTempPriceCycles();
    else getCyclesPendingTempPrice().then(setTempPriceCycles);
  };

  const handleOpenVerifyModal = () => {
    setVerifyPriceModalOpen(true);
    if (verifyCycles.length === 0) handleFetchVerifyCycles();
    else getCyclesPendingVerification().then(setVerifyCycles);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-screen-xl mx-auto">
      {/* 1. Header with Connected Actions */}
      <WelcomeHeader 
        activeSeason="Harvesting"
        onEnterSampleDataClick={handleOpenSampleModal}
        onSetTemporaryPriceClick={handleOpenTempPriceModal}
        onVerifyPriceClick={handleOpenVerifyModal}
        onEditCycleClick={() => {}}
        onGenerateShipmentBillClick={() => setShipmentModalOpen(true)}
        onProcessFarmerPaymentsClick={() => setPaymentModalOpen(true)}
        onFinanceClick={() => setFinanceModalOpen(true)}
      />

      {/* 2. Metrics Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${isStatsLoading && !stats ? 'opacity-30' : 'opacity-100'}`}>
        {stats && (
          <>
            <CyclePipelineCard 
              data={{
                total: stats.pipeline,
                last24Hours: { harvested: 0, sampled: 0, priced: 0, weighed: 0 } 
              }} 
            />
            <CriticalAlertsCard 
              data={{ 
                pricedOver12DaysNotWeighed: stats.alerts.stuck_cycles, 
                weighedNotLoaded: stats.alerts.ready_to_load 
              }} 
            />
            <FinancialOverviewCard 
              data={{ 
                payments: { pending: stats.finance.pending_payments, given: 0 }, 
                cheques: { 
                  dueTodayCount: stats.finance.cheques_due_today, 
                  dueTodayAmount: stats.finance.cheques_amount 
                } 
              }} 
            />
            <ShipmentSummaryCard data={{ shipments: [], chequesToVerifyCount: 0 }} />
          </>
        )}
      </div>

      {/* 3. Master Table Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
        <p className="text-gray-400 font-medium italic">
          Master Harvesting Pipeline Table (Logic pending implementation)
        </p>
      </div>

      {/* MODALS */}
      <SampleEntryModal 
        isOpen={isSampleModalOpen} 
        onClose={() => setSampleModalOpen(false)} 
        cycles={sampleCycles}
        onRefresh={handleFetchSampleCycles}
        isRefreshing={isSampleRefreshing}
      />

      <SetTemporaryPriceModal 
        isOpen={isTempPriceModalOpen} 
        onClose={() => setTempPriceModalOpen(false)} 
        cycles={tempPriceCycles}
        onRefresh={handleFetchTempPriceCycles}
        isRefreshing={isTempRefreshing}
      />
      
      <VerifyPriceModal 
        isOpen={isVerifyPriceModalOpen} 
        onClose={() => setVerifyPriceModalOpen(false)} 
        cycles={verifyCycles} 
        onRefresh={handleFetchVerifyCycles} 
        isRefreshing={isVerifyRefreshing} 
      />

      <SelectShipmentBillModal isOpen={isShipmentModalOpen} onClose={() => setShipmentModalOpen(false)} shipments={[]} isLoading={false} />
      <SelectPaymentCycleModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} cycles={[]} isLoading={false} />
      <FinanceActionModal isOpen={isFinanceModalOpen} onClose={() => setFinanceModalOpen(false)} wallets={[]} companies={[]} />
    </div>
  );
}