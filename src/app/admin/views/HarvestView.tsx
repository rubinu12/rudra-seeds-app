"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import { useAdmin } from '@/src/components/admin/AdminProvider';

// ACTIONS
import { getDashboardStats, DashboardStats } from '@/src/app/admin/actions/dashboard';
import { getCyclesPendingSampleEntry, CycleForSampleEntry } from '@/src/app/admin/actions/sample-actions';
import { getCyclesPendingTempPrice, getCyclesPendingVerification, CycleForPriceApproval } from '@/src/app/admin/actions/pricing-actions';
import { getCyclesReadyForPayment, CycleForPaymentSelection } from '@/src/app/admin/payments/actions'; 
// NEW: Import Finance Actions
import { getFinanceDashboardData, FinanceData } from '@/src/app/admin/finance/actions';

// COMPONENTS
import WelcomeHeader from "@/src/components/admin/WelcomeHeader";
import CyclePipelineCard from '@/src/components/admin/harvesting/CyclePipelineCard';
import CriticalAlertsCard from '@/src/components/admin/harvesting/CriticalAlertsCard';
import FinancialOverviewCard from '@/src/components/admin/harvesting/FinancialOverviewCard';
import ShipmentSummaryCard from '@/src/components/admin/harvesting/ShipmentSummaryCard';

// MODALS
import SampleEntryModal from '@/src/components/admin/harvesting/SampleEntryModal';
import SetTemporaryPriceModal from '@/src/components/admin/harvesting/SetTemporaryPriceModal';
import VerifyPriceModal from '@/src/components/admin/harvesting/VerifyPriceModal';
import SelectPaymentCycleModal from '@/src/components/admin/harvesting/SelectPaymentCycleModal';
import FinanceActionModal from '@/src/components/admin/finance/FinanceActionModal';

// --- Default Empty State for Finance (Prevents crashes before load) ---
const initialFinanceData: FinanceData = {
  balance: 0,
  receivables: [],
  companies: [],
  debtCheques: [],
  totalDebt: 0,
  recentHistory: []
};

export default function HarvestView() {
  const router = useRouter(); 
  const { year } = useAdmin();
  
  // --- Dashboard Stats State ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // --- Modal Data States ---
  const [sampleCycles, setSampleCycles] = useState<CycleForSampleEntry[]>([]);
  const [tempPriceCycles, setTempPriceCycles] = useState<CycleForPriceApproval[]>([]);
  const [verifyCycles, setVerifyCycles] = useState<any[]>([]);
  const [paymentCycles, setPaymentCycles] = useState<CycleForPaymentSelection[]>([]);
  
  // NEW: Finance Data State
  const [financeData, setFinanceData] = useState<FinanceData>(initialFinanceData);

  // --- Modal Visibility States ---
  const [isSampleModalOpen, setSampleModalOpen] = useState(false);
  const [isTempPriceModalOpen, setTempPriceModalOpen] = useState(false);
  const [isVerifyPriceModalOpen, setVerifyPriceModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isFinanceModalOpen, setFinanceModalOpen] = useState(false);

  // --- Loading States ---
  const [isSampleRefreshing, setIsSampleRefreshing] = useState(false);
  const [isTempRefreshing, setIsTempRefreshing] = useState(false);
  const [isVerifyRefreshing, setIsVerifyRefreshing] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false); 
  const [isFinanceLoading, setIsFinanceLoading] = useState(false); // New Loading State

  const CACHE_KEY = `harvest_stats_${year}`;

  // --- 1. Fetch Dashboard Stats ---
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

  // --- Data Fetchers ---
  const handleFetchSampleCycles = useCallback(async () => {
    setIsSampleRefreshing(true);
    getCyclesPendingSampleEntry().then(setSampleCycles).finally(() => setIsSampleRefreshing(false));
  }, []);

  const handleFetchTempPriceCycles = useCallback(async () => {
    setIsTempRefreshing(true);
    getCyclesPendingTempPrice().then(setTempPriceCycles).finally(() => setIsTempRefreshing(false));
  }, []);

  const handleFetchVerifyCycles = useCallback(async () => {
    setIsVerifyRefreshing(true);
    getCyclesPendingVerification().then(setVerifyCycles).finally(() => setIsVerifyRefreshing(false));
  }, []);

  const handleFetchPaymentCycles = useCallback(async () => {
    setIsPaymentLoading(true);
    try {
      const data = await getCyclesReadyForPayment();
      setPaymentCycles(data);
    } catch (error) {
      console.error("Payment Fetch Error:", error);
    } finally {
      setIsPaymentLoading(false);
    }
  }, []);

  // NEW: Fetch Finance Data
  const handleFetchFinance = useCallback(async () => {
    setIsFinanceLoading(true);
    try {
        const data = await getFinanceDashboardData();
        setFinanceData(data);
    } catch (error) {
        console.error("Finance Fetch Error:", error);
    } finally {
        setIsFinanceLoading(false);
    }
  }, []);

  // --- Open Handlers (Fetch on Open) ---
  const handleOpenSampleModal = () => {
    setSampleModalOpen(true);
    handleFetchSampleCycles();
  };

  const handleOpenTempPriceModal = () => {
    setTempPriceModalOpen(true);
    handleFetchTempPriceCycles();
  };

  const handleOpenVerifyModal = () => {
    setVerifyPriceModalOpen(true);
    handleFetchVerifyCycles();
  };

  const handleOpenPaymentModal = () => {
    setPaymentModalOpen(true);
    handleFetchPaymentCycles();
  };

  // NEW: Open Finance Modal Handler
  const handleOpenFinanceModal = () => {
    setFinanceModalOpen(true);
    handleFetchFinance(); // Fetch fresh data when opening
  };

  // --- Init ---
  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      setStats(JSON.parse(cached));
      fetchDashboardStats(true);
    } else {
      fetchDashboardStats(false);
    }
    const interval = setInterval(() => fetchDashboardStats(true), 1800000); // 30 min refresh
    return () => clearInterval(interval);
  }, [CACHE_KEY, fetchDashboardStats]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-screen-xl mx-auto">
      
      {/* 1. Header with Connected Actions */}
      <WelcomeHeader 
        activeSeason="Harvesting"
        
        // Modal Openers
        onEnterSampleDataClick={handleOpenSampleModal}
        onSetTemporaryPriceClick={handleOpenTempPriceModal}
        onVerifyPriceClick={handleOpenVerifyModal}
        onProcessFarmerPaymentsClick={handleOpenPaymentModal}
        
        // Updated Finance Click Handler
        onFinanceClick={handleOpenFinanceModal}
        
        // Navigation Links
        onEditCycleClick={() => {}} // Placeholder
        onGenerateShipmentBillClick={() => router.push('/admin/shipments')}
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

      {/* 3. Placeholder for Master Table */}
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
        <p className="text-gray-400 font-medium italic">
          Master Harvesting Pipeline Table
        </p>
      </div>

      {/* --- MODALS --- */}
      
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

      <SelectPaymentCycleModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        cycles={paymentCycles} 
        isLoading={isPaymentLoading} 
      />

      {/* FIXED FINANCE MODAL USAGE */}
      <FinanceActionModal 
        isOpen={isFinanceModalOpen} 
        onClose={() => setFinanceModalOpen(false)} 
        data={financeData} // <--- Replaced wallets/companies with data
      />
      
    </div>
  );
}