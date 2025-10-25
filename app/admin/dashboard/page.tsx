// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import KeyMetrics from "@/components/admin/KeyMetrics";
import Sidebar from "@/components/admin/Sidebar";
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import AddLandmarkModal from '@/components/admin/modals/AddLandmarkModal';
import AddVarietyModal from '@/components/admin/modals/AddVarietyModal';
import { LoaderCircle } from 'lucide-react';
import Navbar, { Season } from '@/components/admin/Navbar';

// Import data fetching functions
import {
    getCyclePipelineStatus, getCriticalAlerts, getFinancialOverview,
    getShipmentSummary, getCyclesPendingSampleEntry, getCyclesPendingTempPrice,
    getCyclesPendingVerification, // Function needed for refresh
    CyclePipelineStatus, CriticalAlertsData, FinancialOverviewData, ShipmentSummaryData
} from '@/lib/admin-data';

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

// *** Combined state type for harvesting data ***
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
    const [isLandmarkModalOpen, setLandmarkModalOpen] = useState(false);
    const [isVarietyModalOpen, setVarietyModalOpen] = useState(false);
    const [activeSeason, setActiveSeason] = useState<Season>('Harvesting');
    const [harvestingData, setHarvestingData] = useState<HarvestingDashboardData | null>(null);
    const [isLoadingHarvestingData, setIsLoadingHarvestingData] = useState(false);
    const [errorLoadingHarvestingData, setErrorLoadingHarvestingData] = useState<string | null>(null);

    // *** State specifically for modal refresh loading indicator ***
    const [isModalRefreshing, setIsModalRefreshing] = useState(false);

    const [isSampleEntryModalOpen, setSampleEntryModalOpen] = useState(false);
    const [isSetTemporaryPriceModalOpen, setSetTemporaryPriceModalOpen] = useState(false);
    const [isVerifyPriceModalOpen, setVerifyPriceModalOpen] = useState(false);


    const handleSeasonChange = (season: Season) => {
        setActiveSeason(season);
        if (season !== 'Harvesting') {
            setHarvestingData(null);
            setErrorLoadingHarvestingData(null);
        }
    };

    // *** Encapsulated data fetching logic ***
    const fetchHarvestingData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoadingHarvestingData(true); // Show main loader only on initial load
        if (isRefresh) setIsModalRefreshing(true); // Show modal loader on refresh
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
    }, []); // Empty dependency array as it uses no external state other than fetch functions

    // Fetch harvesting data effect
    useEffect(() => {
        if (activeSeason === 'Harvesting' && !harvestingData && !isLoadingHarvestingData) {
            fetchHarvestingData(false); // Initial fetch
        }
        // Clear data if switching away from Harvesting (optional, keeps data cached if removed)
        // else if (activeSeason !== 'Harvesting') {
        //     setHarvestingData(null);
        // }
    }, [activeSeason, harvestingData, isLoadingHarvestingData, fetchHarvestingData]);

    // *** Refresh handler function to pass to modals ***
    const handleModalRefresh = useCallback(async () => {
        // Specifically re-fetch the data relevant to the modals
        // Or re-fetch all harvesting data for simplicity
        await fetchHarvestingData(true);
    }, [fetchHarvestingData]);


    // Renders content based on the active season
    const renderSeasonContent = () => {
        // ... (switch cases remain the same, just render the content)
        switch (activeSeason) {
            case 'Harvesting':
                if (isLoadingHarvestingData && !isModalRefreshing) { // Don't show main loader during modal refresh
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
                return null; // Or a loading/empty state specifically for when harvestingData is null
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
                            onAddLandmarkClick={() => setLandmarkModalOpen(true)}
                            onAddVarietyClick={() => setVarietyModalOpen(true)}
                            onEnterSampleDataClick={() => activeSeason === 'Harvesting' && setSampleEntryModalOpen(true)}
                            onSetTemporaryPriceClick={() => activeSeason === 'Harvesting' && setSetTemporaryPriceModalOpen(true)}
                            onVerifyPriceClick={() => activeSeason === 'Harvesting' && setVerifyPriceModalOpen(true)}
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
            <AddLandmarkModal isOpen={isLandmarkModalOpen} onClose={() => setLandmarkModalOpen(false)} />
            <AddVarietyModal isOpen={isVarietyModalOpen} onClose={() => setVarietyModalOpen(false)} />

            {/* Pass refresh handler and state to relevant modals */}
            <SampleEntryModal
                isOpen={isSampleEntryModalOpen}
                onClose={() => setSampleEntryModalOpen(false)}
                cycles={harvestingData?.cyclesPendingSampleEntry || []}
                // onRefresh={handleModalRefresh} // Add if refresh needed here
                // isRefreshing={isModalRefreshing}
            />
             <SetTemporaryPriceModal
                isOpen={isSetTemporaryPriceModalOpen}
                onClose={() => setSetTemporaryPriceModalOpen(false)}
                cycles={harvestingData?.cyclesPendingTempPrice || []}
                // onRefresh={handleModalRefresh} // Add if refresh needed here
                // isRefreshing={isModalRefreshing}
            />
             <VerifyPriceModal
                isOpen={isVerifyPriceModalOpen}
                onClose={() => setVerifyPriceModalOpen(false)}
                cycles={harvestingData?.cyclesPendingVerification || []}
                onRefresh={handleModalRefresh} // Pass refresh function
                isRefreshing={isModalRefreshing} // Pass refresh loading state
            />
        </>
    );
}