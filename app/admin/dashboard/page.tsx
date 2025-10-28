// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import KeyMetrics from "@/components/admin/KeyMetrics";
import Sidebar from "@/components/admin/Sidebar";
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import { LoaderCircle } from 'lucide-react';
import Navbar, { Season } from '@/components/admin/Navbar';

// Import data fetching functions
import {
    getCyclePipelineStatus, getCriticalAlerts, getFinancialOverview,
    getShipmentSummary, getCyclesPendingSampleEntry, getCyclesPendingTempPrice,
    getCyclesPendingVerification,
    CyclePipelineStatus, CriticalAlertsData, FinancialOverviewData, ShipmentSummaryData
} from '@/lib/admin-data';
import { getDispatchedShipmentsForBilling, DispatchedShipmentInfo } from '@/lib/shipment-data';
// *** ADD Import for payment cycle list fetching ***
import { getCyclesReadyForPayment, CycleForPaymentSelection } from '@/lib/payment-data';


// Import CycleFor... types
import type {
    CycleForSampleEntry, CycleForPriceApproval, CycleForPriceVerification
} from '@/lib/definitions';

// Import card components
import CyclePipelineCard from '@/components/admin/harvesting/CyclePipelineCard';
import CriticalAlertsCard from '@/components/admin/harvesting/CriticalAlertsCard';
import FinancialOverviewCard from '@/components/admin/harvesting/FinancialOverviewCard';
import ShipmentSummaryCard from '@/components/admin/harvesting/ShipmentSummaryCard';

// Import modal components
import SampleEntryModal from '@/components/admin/harvesting/SampleEntryModal';
import SetTemporaryPriceModal from '@/components/admin/harvesting/SetTemporaryPriceModal';
import VerifyPriceModal from '@/components/admin/harvesting/VerifyPriceModal';
import EditCycleModal from '@/components/admin/modals/EditCycleModal';
import SelectShipmentBillModal from '@/components/admin/harvesting/SelectShipmentBillModal';
// *** ADD Import for SelectPaymentCycleModal ***
import SelectPaymentCycleModal from '@/components/admin/harvesting/SelectPaymentCycleModal';


// Combined state type for harvesting data
type HarvestingDashboardData = {
    pipelineStatus: CyclePipelineStatus;
    criticalAlerts: CriticalAlertsData;
    financialOverview: FinancialOverviewData;
    shipmentSummary: ShipmentSummaryData;
    cyclesPendingSampleEntry: CycleForSampleEntry[];
    cyclesPendingTempPrice: CycleForPriceApproval[];
    cyclesPendingVerification: CycleForPriceVerification[];
};

export default function AdminDashboardPage() {
    // --- State for Modals ---
    const [isSampleEntryModalOpen, setSampleEntryModalOpen] = useState(false);
    const [isSetTemporaryPriceModalOpen, setSetTemporaryPriceModalOpen] = useState(false);
    const [isVerifyPriceModalOpen, setVerifyPriceModalOpen] = useState(false);
    const [isEditCycleModalOpen, setIsEditCycleModalOpen] = useState(false);
    const [isSelectShipmentModalOpen, setIsSelectShipmentModalOpen] = useState(false);
    const [isSelectPaymentModalOpen, setIsSelectPaymentModalOpen] = useState(false); // *** ADD State for Payment Select Modal ***

    // --- State for Season & Data ---
    const [activeSeason, setActiveSeason] = useState<Season>('Sowing');
    const [harvestingData, setHarvestingData] = useState<HarvestingDashboardData | null>(null);
    const [isLoadingHarvestingData, setIsLoadingHarvestingData] = useState(false);
    const [errorLoadingHarvestingData, setErrorLoadingHarvestingData] = useState<string | null>(null);
    const [isModalRefreshing, setIsModalRefreshing] = useState(false);
    const [dispatchedShipments, setDispatchedShipments] = useState<DispatchedShipmentInfo[]>([]);
    const [isLoadingDispatchedShipments, setIsLoadingDispatchedShipments] = useState(false);
    // *** ADD State for payment cycles list and loading ***
    const [paymentCycles, setPaymentCycles] = useState<CycleForPaymentSelection[]>([]);
    const [isLoadingPaymentCycles, setIsLoadingPaymentCycles] = useState(false);


    const handleSeasonChange = (season: Season) => {
        setActiveSeason(season);
        if (season !== 'Harvesting') {
            setHarvestingData(null);
            setErrorLoadingHarvestingData(null);
        }
    };

    // Data fetching logic (unchanged)
    const fetchHarvestingData = useCallback(async (isRefresh = false) => {
        // ... (fetch logic remains the same) ...
        if (!isRefresh) setIsLoadingHarvestingData(true);
        if (isRefresh) setIsModalRefreshing(true);
        setErrorLoadingHarvestingData(null);
        console.log(isRefresh ? "Refreshing harvesting data..." : "Fetching harvesting data...");
        try {
            const [
                pipelineStatus, criticalAlerts, financialOverview,
                shipmentSummary, cyclesPendingSampleEntry, cyclesPendingTempPrice,
                cyclesPendingVerification
            ] = await Promise.all([
                getCyclePipelineStatus(), getCriticalAlerts(), getFinancialOverview(),
                getShipmentSummary(), getCyclesPendingSampleEntry(), getCyclesPendingTempPrice(),
                getCyclesPendingVerification()
            ]);
            setHarvestingData({
                pipelineStatus, criticalAlerts, financialOverview,
                shipmentSummary, cyclesPendingSampleEntry, cyclesPendingTempPrice,
                cyclesPendingVerification
            });
            console.log(isRefresh ? "Harvesting data refreshed." : "Harvesting data fetched successfully.");
        } catch (error) {
            console.error("Failed to fetch harvesting dashboard data:", error);
            setErrorLoadingHarvestingData(`Failed to load harvesting data: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            if (!isRefresh) setIsLoadingHarvestingData(false);
            if (isRefresh) setIsModalRefreshing(false);
        }
    }, []);

    // Effect to fetch data (unchanged)
    useEffect(() => {
        if (activeSeason === 'Harvesting' && !harvestingData && !isLoadingHarvestingData) {
            fetchHarvestingData(false);
        }
    }, [activeSeason, harvestingData, isLoadingHarvestingData, fetchHarvestingData]);

    // Refresh handler (unchanged)
    const handleModalRefresh = useCallback(async () => {
        await fetchHarvestingData(true);
    }, [fetchHarvestingData]);

    // Handler to open Edit Cycle Modal (unchanged)
    const handleOpenEditModal = () => {
        setIsEditCycleModalOpen(true);
    };

    // Handler for Generate Shipment Bill (unchanged)
    const handleGenerateShipmentBill = async () => {
        console.log("Fetching dispatched shipments...");
        setIsLoadingDispatchedShipments(true);
        setIsSelectShipmentModalOpen(true); // Open modal immediately
        try {
            const shipments = await getDispatchedShipmentsForBilling();
            setDispatchedShipments(shipments);
        } catch (error) {
            console.error("Error fetching dispatched shipments:", error);
            alert(`Error fetching shipments: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsSelectShipmentModalOpen(false);
        } finally {
            setIsLoadingDispatchedShipments(false);
        }
    };

    // *** UPDATED Handler for Process Farmer Payments ***
    const handleProcessFarmerPayments = async () => {
        console.log("Fetching cycles ready for payment...");
        setIsLoadingPaymentCycles(true);
        setIsSelectPaymentModalOpen(true); // Open modal immediately
        try {
            // Call the server function
            const cycles = await getCyclesReadyForPayment();
            setPaymentCycles(cycles);
        } catch (error) {
            console.error("Error fetching cycles for payment:", error);
            alert(`Error fetching cycles: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsSelectPaymentModalOpen(false); // Close modal on error
        } finally {
            setIsLoadingPaymentCycles(false);
        }
    };


    // Render season content logic (unchanged)
    const renderSeasonContent = () => {
        // ... (switch case remains the same) ...
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-lg p-10 text-center text-on-surface-variant">
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
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <WelcomeHeader
                            onEnterSampleDataClick={() => activeSeason === 'Harvesting' && setSampleEntryModalOpen(true)}
                            onSetTemporaryPriceClick={() => activeSeason === 'Harvesting' && setSetTemporaryPriceModalOpen(true)}
                            onVerifyPriceClick={() => activeSeason === 'Harvesting' && setVerifyPriceModalOpen(true)}
                            onEditCycleClick={handleOpenEditModal}
                            onGenerateShipmentBillClick={handleGenerateShipmentBill}
                            onProcessFarmerPaymentsClick={handleProcessFarmerPayments} // Handler is now updated
                            activeSeason={activeSeason}
                        />
                        {renderSeasonContent()}
                    </div>
                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-1">
                        <Sidebar />
                    </div>
                </div>
            </main>

            {/* Modals */}
            <SampleEntryModal
                isOpen={isSampleEntryModalOpen}
                onClose={() => setSampleEntryModalOpen(false)}
                cycles={harvestingData?.cyclesPendingSampleEntry || []}
            />
             <SetTemporaryPriceModal
                isOpen={isSetTemporaryPriceModalOpen}
                onClose={() => setSetTemporaryPriceModalOpen(false)}
                cycles={harvestingData?.cyclesPendingTempPrice || []}
            />
             <VerifyPriceModal
                isOpen={isVerifyPriceModalOpen}
                onClose={() => setVerifyPriceModalOpen(false)}
                cycles={harvestingData?.cyclesPendingVerification || []}
                onRefresh={handleModalRefresh}
                isRefreshing={isModalRefreshing}
            />
            <EditCycleModal
                isOpen={isEditCycleModalOpen}
                onClose={() => setIsEditCycleModalOpen(false)}
            />
             <SelectShipmentBillModal
                isOpen={isSelectShipmentModalOpen}
                onClose={() => setIsSelectShipmentModalOpen(false)}
                shipments={dispatchedShipments}
                isLoading={isLoadingDispatchedShipments}
            />
             {/* *** RENDER Select Payment Cycle Modal *** */}
             <SelectPaymentCycleModal
                isOpen={isSelectPaymentModalOpen}
                onClose={() => setIsSelectPaymentModalOpen(false)}
                cycles={paymentCycles}
                isLoading={isLoadingPaymentCycles}
            />
        </>
    );
}