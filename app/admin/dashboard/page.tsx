// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import KeyMetrics from "@/components/admin/KeyMetrics";
import Sidebar from "@/components/admin/Sidebar";
import WelcomeHeader from "@/components/admin/WelcomeHeader";
import AddLandmarkModal from '@/components/admin/modals/AddLandmarkModal';
import AddVarietyModal from '@/components/admin/modals/AddVarietyModal';
import { Search, LoaderCircle } from 'lucide-react';
import Navbar, { Season } from '@/components/admin/Navbar';

// Import data fetching functions and types
import {
    getCyclePipelineStatus,
    getCriticalAlerts,
    getFinancialOverview,
    getShipmentSummary,
    getCyclesPendingSampleEntry,
    getCyclesPendingTempPrice, // *** Import new function ***
    // getCyclesPendingVerification,
    CyclePipelineStatus,
    CriticalAlertsData,
    FinancialOverviewData,
    ShipmentSummaryData,
    CycleForSampleEntry,
    CycleForPriceApproval // *** Import new type ***
    // CycleForPriceVerification
} from '@/lib/admin-data'; // Adjust path if needed

// Import the card components
import CyclePipelineCard from '@/components/admin/harvesting/CyclePipelineCard';
import CriticalAlertsCard from '@/components/admin/harvesting/CriticalAlertsCard';
import FinancialOverviewCard from '@/components/admin/harvesting/FinancialOverviewCard';
import ShipmentSummaryCard from '@/components/admin/harvesting/ShipmentSummaryCard';

// Import the modal components
import SampleEntryModal from '@/components/admin/harvesting/SampleEntryModal';
// Import placeholder/actual modal components later
// import SetTemporaryPriceModal from '@/components/admin/harvesting/SetTemporaryPriceModal';
// import VerifyPriceModal from '@/components/admin/harvesting/VerifyPriceModal';
import Modal from '@/components/ui/Modal'; // Using generic Modal for placeholders


// *** Updated HarvestingDashboardData type ***
type HarvestingDashboardData = {
    pipelineStatus: CyclePipelineStatus;
    criticalAlerts: CriticalAlertsData;
    financialOverview: FinancialOverviewData;
    shipmentSummary: ShipmentSummaryData;
    cyclesPendingSampleEntry: CycleForSampleEntry[];
    cyclesPendingTempPrice: CycleForPriceApproval[]; // *** Added field ***
    // cyclesPendingVerification: CycleForPriceVerification[];
};

export default function AdminDashboardPage() {
    const [isLandmarkModalOpen, setLandmarkModalOpen] = useState(false);
    const [isVarietyModalOpen, setVarietyModalOpen] = useState(false);
    const [activeSeason, setActiveSeason] = useState<Season>('Sowing');
    const [harvestingData, setHarvestingData] = useState<HarvestingDashboardData | null>(null);
    const [isLoadingHarvestingData, setIsLoadingHarvestingData] = useState(false);
    const [errorLoadingHarvestingData, setErrorLoadingHarvestingData] = useState<string | null>(null);

    // State for Harvesting modals
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

    // Fetch harvesting data when the season is selected
    useEffect(() => {
        if (activeSeason === 'Harvesting' && !harvestingData && !isLoadingHarvestingData) {
            const fetchData = async () => {
                setIsLoadingHarvestingData(true);
                setErrorLoadingHarvestingData(null);
                try {
                    // Fetch all required data in parallel
                    const [
                        pipelineStatus,
                        criticalAlerts,
                        financialOverview,
                        shipmentSummary,
                        cyclesPendingSampleEntry,
                        cyclesPendingTempPrice // *** Fetch new data ***
                        // cyclesPendingVerification
                    ] = await Promise.all([
                        getCyclePipelineStatus(),
                        getCriticalAlerts(),
                        getFinancialOverview(),
                        getShipmentSummary(),
                        getCyclesPendingSampleEntry(),
                        getCyclesPendingTempPrice() // *** Call new function ***
                        // getCyclesPendingVerification() // Add later
                    ]);
                    // *** Store new data in state ***
                    setHarvestingData({
                        pipelineStatus,
                        criticalAlerts,
                        financialOverview,
                        shipmentSummary,
                        cyclesPendingSampleEntry,
                        cyclesPendingTempPrice
                        // cyclesPendingVerification // Add later
                    });
                } catch (error) {
                    console.error("Failed to fetch harvesting dashboard data:", error);
                    setErrorLoadingHarvestingData("Failed to load harvesting data. Please try again.");
                } finally {
                    setIsLoadingHarvestingData(false);
                }
            };
            fetchData();
        }
    }, [activeSeason, isLoadingHarvestingData, harvestingData]);


    // Renders content based on the active season
    const renderContent = () => {
        switch (activeSeason) {
            case 'Harvesting':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <WelcomeHeader
                                onAddLandmarkClick={() => setLandmarkModalOpen(true)}
                                onAddVarietyClick={() => setVarietyModalOpen(true)}
                                onEnterSampleDataClick={() => setSampleEntryModalOpen(true)}
                                onSetTemporaryPriceClick={() => setSetTemporaryPriceModalOpen(true)} // Connected
                                onVerifyPriceClick={() => setVerifyPriceModalOpen(true)} // Connected
                                activeSeason={activeSeason}
                            />
                            {isLoadingHarvestingData ? (
                                <div className="flex justify-center items-center h-64">
                                    <LoaderCircle className="w-12 h-12 text-primary animate-spin" />
                                </div>
                            ) : errorLoadingHarvestingData ? (
                                <div className="bg-error-container text-on-error-container rounded-xl p-6 text-center">
                                    <p>{errorLoadingHarvestingData}</p>
                                </div>
                            ) : harvestingData ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <CyclePipelineCard data={harvestingData.pipelineStatus} />
                                   <CriticalAlertsCard data={harvestingData.criticalAlerts} />
                                   <FinancialOverviewCard data={harvestingData.financialOverview} />
                                   <ShipmentSummaryCard data={harvestingData.shipmentSummary} />
                                </div>
                            ) : null}
                        </div>
                        <div className="lg:col-span-1">
                            <Sidebar />
                        </div>
                    </div>
                );
            // ... (Growing and Sowing cases remain the same) ...
             case 'Growing':
                  return (
                      <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-lg p-10 text-center text-on-surface-variant">
                          This is the Growing Dashboard View. (Placeholder)
                      </div>
                  );
            case 'Sowing':
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <WelcomeHeader
                                    onAddLandmarkClick={() => setLandmarkModalOpen(true)}
                                    onAddVarietyClick={() => setVarietyModalOpen(true)}
                                    onEnterSampleDataClick={() => {}} // No-op
                                    onSetTemporaryPriceClick={() => {}} // No-op
                                    onVerifyPriceClick={() => {}} // No-op
                                    activeSeason={activeSeason}
                                />
                                <KeyMetrics />
                            </div>
                            <div className="lg:col-span-1">
                                <Sidebar />
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <>
            <Navbar activeSeason={activeSeason} onSeasonChange={handleSeasonChange} />
            <main className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">
                {renderContent()}
            </main>

            {/* Existing Modals */}
            <AddLandmarkModal isOpen={isLandmarkModalOpen} onClose={() => setLandmarkModalOpen(false)} />
            <AddVarietyModal isOpen={isVarietyModalOpen} onClose={() => setVarietyModalOpen(false)} />

            {/* Harvesting Modals */}
            <SampleEntryModal
                isOpen={isSampleEntryModalOpen}
                onClose={() => setSampleEntryModalOpen(false)}
                cycles={harvestingData?.cyclesPendingSampleEntry || []}
            />

            {/* Placeholder Modal for Set Temp Price - now receives data */}
            <Modal
                isOpen={isSetTemporaryPriceModalOpen}
                onClose={() => setSetTemporaryPriceModalOpen(false)}
                title="Set Temporary Price (Placeholder)"
                maxWidth="max-w-2xl" // Wider modal might be needed
            >
                <p>List of cycles with status 'Sampled' will appear here ({harvestingData?.cyclesPendingTempPrice?.length || 0} found).</p>
                 {/* Pass data like: cycles={harvestingData?.cyclesPendingTempPrice || []} */}
                 {/* Temp display to verify data fetch */}
                 <pre className="text-xs max-h-60 overflow-auto bg-surface p-2 rounded mt-4">
                    {JSON.stringify(harvestingData?.cyclesPendingTempPrice, null, 2)}
                 </pre>
            </Modal>

            {/* Placeholder Modal for Verify Price */}
            <Modal
                isOpen={isVerifyPriceModalOpen}
                onClose={() => setVerifyPriceModalOpen(false)}
                title="Verify Price (Placeholder)"
                maxWidth="max-w-2xl"
            >
                 <p>List of cycles with status 'Price Proposed' will appear here.</p>
                 {/* Pass data like: cycles={harvestingData?.cyclesPendingVerification || []} */}
            </Modal>
        </>
    );
}