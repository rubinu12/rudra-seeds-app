// app/employee/harvesting/loading/new/page.tsx
import { getCyclesToWeigh } from '@/app/employee/harvesting/data';
import { getSettingsShipmentCompanies, getSettingsDestinationCompanies } from '@/app/admin/settings/data'; // Fetch functions from admin settings data
import { NewShipmentForm } from './NewShipmentForm'; // Client component (to be created)
import HarvestingHeader from '@/components/employee/harvesting/HarvestingHeader'; // Re-use header
import HarvestingBottomNav from '@/components/employee/harvesting/HarvestingBottomNav'; // Re-use bottom nav
import { Package } from 'lucide-react';

export default async function NewShipmentPage() {
    console.log('[SERVER] Fetching data for New Shipment page...');

    // Fetch required data in parallel
    const [
        transportCompanies,
        destinationCompanies,
        cyclesReadyForLoading,
    ] = await Promise.all([
        getSettingsShipmentCompanies(), // Fetches active shipment companies
        getSettingsDestinationCompanies(), // Fetches active destination companies
        getCyclesToWeigh(), // Fetches cycles with status='Weighed' and bags_remaining_to_load > 0
    ]);

    // Filter companies to only include active ones, as the fetch functions return all
    const activeTransportCompanies = transportCompanies.filter(c => c.is_active);
    const activeDestinationCompanies = destinationCompanies.filter(c => c.is_active);

    console.log(`[SERVER] Data fetched: ${activeTransportCompanies.length} active transport companies, ${activeDestinationCompanies.length} active destinations, ${cyclesReadyForLoading.length} cycles ready.`);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header - Simple static header for this page */}
            <header className="sticky top-0 left-0 right-0 z-20 bg-surface/80 backdrop-blur-md border-b border-outline/30">
                <div className="max-w-xl mx-auto flex items-center h-16 px-4 gap-3">
                    <Package className="w-6 h-6 text-primary" />
                    <h1 className="text-xl font-medium text-on-surface">Create New Shipment</h1>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow p-4 max-w-xl mx-auto w-full pb-20">
                <NewShipmentForm
                    transportCompanies={activeTransportCompanies}
                    destinationCompanies={activeDestinationCompanies}
                    cyclesReadyForLoading={cyclesReadyForLoading}
                />
            </main>

            {/* Bottom Nav - Set active state */}
            <HarvestingBottomNav
                activeBottomNav={'loading'} // Set 'loading' as active
                setActiveBottomNav={() => {}} // Dummy function, navigation handled by links/routing
            />
        </div>
    );
}