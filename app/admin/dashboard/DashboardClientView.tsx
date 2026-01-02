// app/admin/dashboard/DashboardClientView.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Navbar, { Season } from '@/components/admin/Navbar';
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import Sidebar from "@/components/admin/Sidebar";
import KeyMetrics from "@/components/admin/KeyMetrics";
import { LoaderCircle } from 'lucide-react';

// Data Fetching
import {
    getCyclePipelineStatus, getCriticalAlerts, getFinancialOverview,
    getShipmentSummary, getCyclesPendingSampleEntry, getCyclesPendingTempPrice,
    getCyclesPendingVerification, getDestinationCompanies,
    CyclePipelineStatus, CriticalAlertsData, FinancialOverviewData, ShipmentSummaryData
} from '@/lib/admin-data';
import { getDispatchedShipmentsForBilling, DispatchedShipmentInfo } from '@/lib/shipment-data';
import { getCyclesReadyForPayment, CycleForPaymentSelection } from '@/lib/payment-data';
import { getWallets } from '@/lib/finance-data';

// Types
import type { CycleForSampleEntry, CycleForPriceApproval, CycleForPriceVerification } from '@/lib/definitions';

// Components
import CyclePipelineCard from '@/components/admin/harvesting/CyclePipelineCard';
import CriticalAlertsCard from '@/components/admin/harvesting/CriticalAlertsCard';
import FinancialOverviewCard from '@/components/admin/harvesting/FinancialOverviewCard';
import ShipmentSummaryCard from '@/components/admin/harvesting/ShipmentSummaryCard';

// Modals
import SampleEntryModal from '@/components/admin/harvesting/SampleEntryModal';
import SetTemporaryPriceModal from '@/components/admin/harvesting/SetTemporaryPriceModal';
import VerifyPriceModal from '@/components/admin/harvesting/VerifyPriceModal';
import EditCycleModal from '@/components/admin/modals/EditCycleModal';
import SelectShipmentBillModal from '@/components/admin/harvesting/SelectShipmentBillModal';
import SelectPaymentCycleModal from '@/components/admin/harvesting/SelectPaymentCycleModal';
import FinanceActionModal from '@/components/admin/finance/FinanceActionModal';

type HarvestingDashboardData = {
    pipelineStatus: CyclePipelineStatus;
    criticalAlerts: CriticalAlertsData;
    financialOverview: FinancialOverviewData;
    shipmentSummary: ShipmentSummaryData;
    cyclesPendingSampleEntry: CycleForSampleEntry[];
    cyclesPendingTempPrice: CycleForPriceApproval[];
    cyclesPendingVerification: CycleForPriceVerification[];
};

type Props = {
    initialSeason: Season;
};

export default function DashboardClientView({ initialSeason }: Props) {
    // --- State: Initialize with Server Data ---
    const [activeSeason, setActiveSeason] = useState<Season>(initialSeason);

    // --- Modals State ---
    const [isSampleEntryModalOpen, setSampleEntryModalOpen] = useState(false);
    const [isSetTemporaryPriceModalOpen, setSetTemporaryPriceModalOpen] = useState(false);
    const [isVerifyPriceModalOpen, setVerifyPriceModalOpen] = useState(false);
    const [isEditCycleModalOpen, setIsEditCycleModalOpen] = useState(false);
    const [isSelectShipmentModalOpen, setIsSelectShipmentModalOpen] = useState(false);
    const [isSelectPaymentModalOpen, setIsSelectPaymentModalOpen] = useState(false);
    
    // Finance Modal
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [financeOptions, setFinanceOptions] = useState<{ wallets: any[], companies: any[] }>({ wallets: [], companies: [] });

    // --- Data State ---
    const [harvestingData, setHarvestingData] = useState<HarvestingDashboardData | null>(null);
    const [isLoadingHarvestingData, setIsLoadingHarvestingData] = useState(false);
    const [errorLoadingHarvestingData, setErrorLoadingHarvestingData] = useState<string | null>(null);
    const [isModalRefreshing, setIsModalRefreshing] = useState(false);
    const [dispatchedShipments, setDispatchedShipments] = useState<DispatchedShipmentInfo[]>([]);
    const [isLoadingDispatchedShipments, setIsLoadingDispatchedShipments] = useState(false);
    const [paymentCycles, setPaymentCycles] = useState<CycleForPaymentSelection[]>([]);
    const [isLoadingPaymentCycles, setIsLoadingPaymentCycles] = useState(false);

    const handleSeasonChange = (season: Season) => {
        setActiveSeason(season);
        if (season !== 'Harvesting') setHarvestingData(null);
    };

    const fetchHarvestingData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoadingHarvestingData(true);
        if (isRefresh) setIsModalRefreshing(true);
        setErrorLoadingHarvestingData(null);
        try {
            const [
                pipelineStatus, criticalAlerts, financialOverview,
                shipmentSummary, cyclesPendingSampleEntry, cyclesPendingTempPrice,
                cyclesPendingVerification,
                wallets, companies
            ] = await Promise.all([
                getCyclePipelineStatus(), getCriticalAlerts(), getFinancialOverview(),
                getShipmentSummary(), getCyclesPendingSampleEntry(), getCyclesPendingTempPrice(),
                getCyclesPendingVerification(),
                getWallets(), getDestinationCompanies()
            ]);

            setHarvestingData({
                pipelineStatus, criticalAlerts, financialOverview,
                shipmentSummary, cyclesPendingSampleEntry, cyclesPendingTempPrice,
                cyclesPendingVerification
            });
            
            setFinanceOptions({ 
                wallets: wallets.map((w: any) => ({ id: w.wallet_id, name: w.wallet_name })), 
                companies: companies.map((c: any) => ({ id: c.id, name: c.name }))
            });

        } catch (error) {
            console.error(error);
            setErrorLoadingHarvestingData("Failed to load dashboard data.");
        } finally {
            if (!isRefresh) setIsLoadingHarvestingData(false);
            if (isRefresh) setIsModalRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (activeSeason === 'Harvesting' && !harvestingData && !isLoadingHarvestingData) {
            fetchHarvestingData(false);
        }
    }, [activeSeason, harvestingData, isLoadingHarvestingData, fetchHarvestingData]);

    const handleModalRefresh = useCallback(async () => {
        await fetchHarvestingData(true);
    }, [fetchHarvestingData]);

    const handleOpenEditModal = () => setIsEditCycleModalOpen(true);
    
    const handleGenerateShipmentBill = async () => {
        setIsLoadingDispatchedShipments(true);
        setIsSelectShipmentModalOpen(true);
        try {
            const shipments = await getDispatchedShipmentsForBilling();
            setDispatchedShipments(shipments);
        } catch (e) { alert("Error loading shipments"); setIsSelectShipmentModalOpen(false); }
        finally { setIsLoadingDispatchedShipments(false); }
    };

    const handleProcessFarmerPayments = async () => {
        setIsLoadingPaymentCycles(true);
        setIsSelectPaymentModalOpen(true);
        try {
            const cycles = await getCyclesReadyForPayment();
            setPaymentCycles(cycles);
        } catch (e) { alert("Error loading cycles"); setIsSelectPaymentModalOpen(false); }
        finally { setIsLoadingPaymentCycles(false); }
    };

    const renderSeasonContent = () => {
        switch (activeSeason) {
            case 'Harvesting':
                if (isLoadingHarvestingData && !isModalRefreshing) {
                    return <div className="flex justify-center items-center h-64"><LoaderCircle className="w-12 h-12 text-primary animate-spin" /></div>;
                }
                if (errorLoadingHarvestingData) {
                    return <div className="bg-error-container text-on-error-container rounded-xl p-6 text-center"><p>{errorLoadingHarvestingData}</p></div>;
                }
                if (harvestingData) {
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                           <CyclePipelineCard data={harvestingData.pipelineStatus} />
                           <CriticalAlertsCard data={harvestingData.criticalAlerts} />
                           <FinancialOverviewCard data={harvestingData.financialOverview} />
                           <ShipmentSummaryCard data={harvestingData.shipmentSummary} />
                        </div>
                    );
                }
                return null;
            case 'Growing':
                 return (
                    <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-lg p-10 text-center text-on-surface-variant animate-fadeIn">
                        Growing Dashboard View. (Placeholder)
                    </div>
                );
            case 'Sowing':
            default:
                 return <KeyMetrics />;
        }
    };

    return (
        <>
            <Navbar activeSeason={activeSeason} onSeasonChange={handleSeasonChange} />
            <main className="max-w-screen-xl mx-auto p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <WelcomeHeader
                            activeSeason={activeSeason}
                            onEnterSampleDataClick={() => setSampleEntryModalOpen(true)}
                            onSetTemporaryPriceClick={() => setSetTemporaryPriceModalOpen(true)}
                            onVerifyPriceClick={() => setVerifyPriceModalOpen(true)}
                            onEditCycleClick={handleOpenEditModal}
                            onGenerateShipmentBillClick={handleGenerateShipmentBill}
                            onProcessFarmerPaymentsClick={handleProcessFarmerPayments}
                            onFinanceClick={() => setIsFinanceModalOpen(true)}
                        />
                        {renderSeasonContent()}
                    </div>
                    <div className="lg:col-span-1"><Sidebar /></div>
                </div>
            </main>

            {/* Modals */}
            <SampleEntryModal isOpen={isSampleEntryModalOpen} onClose={() => setSampleEntryModalOpen(false)} cycles={harvestingData?.cyclesPendingSampleEntry || []} />
            <SetTemporaryPriceModal isOpen={isSetTemporaryPriceModalOpen} onClose={() => setSetTemporaryPriceModalOpen(false)} cycles={harvestingData?.cyclesPendingTempPrice || []} />
            <VerifyPriceModal isOpen={isVerifyPriceModalOpen} onClose={() => setVerifyPriceModalOpen(false)} cycles={harvestingData?.cyclesPendingVerification || []} onRefresh={() => fetchHarvestingData(true)} isRefreshing={isModalRefreshing} />
            <EditCycleModal isOpen={isEditCycleModalOpen} onClose={() => setIsEditCycleModalOpen(false)} />
            <SelectShipmentBillModal isOpen={isSelectShipmentModalOpen} onClose={() => setIsSelectShipmentModalOpen(false)} shipments={dispatchedShipments} isLoading={isLoadingDispatchedShipments} />
            <SelectPaymentCycleModal isOpen={isSelectPaymentModalOpen} onClose={() => setIsSelectPaymentModalOpen(false)} cycles={paymentCycles} isLoading={isLoadingPaymentCycles} />
            <FinanceActionModal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} wallets={financeOptions.wallets} companies={financeOptions.companies} />
        </>
    );
}