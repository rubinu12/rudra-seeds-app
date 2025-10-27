// app/employee/dashboard/page.tsx
import { getEmployeeMode } from '@/app/admin/settings/data';
import HarvestingDashboard from '@/app/employee/harvesting/HarvestingDashboard';
import ClientPage from './ClientPage';
import { CropCycleForEmployee } from '@/lib/definitions';
import { getCyclesToSample, getCyclesReadyForLoading, getCyclesToStartWeighing } from '@/app/employee/harvesting/data';
import { getInProgressShipments } from '@/app/employee/loading/data';
import { getSettingsShipmentCompanies, getSettingsDestinationCompanies } from '@/app/admin/settings/data';


export default async function EmployeeDashboardPage() {
  const currentMode = await getEmployeeMode();
  console.log(`[dashboard/page.tsx] Current Mode: ${currentMode}`); // <<< CONSOLE LOG 4

  if (currentMode === 'Harvesting') {
    console.log("[dashboard/page.tsx] Fetching data for Harvesting Dashboard..."); // <<< CONSOLE LOG 5
    const [
        cyclesToSample,
        cyclesReadyForLoading,
        cyclesToStartWeighing,
        inProgressShipments,
        transportCompaniesAll,
        destinationCompaniesAll,
    ] = await Promise.all([
      getCyclesToSample(),
      getCyclesReadyForLoading(),
      getCyclesToStartWeighing(),
      getInProgressShipments(),
      getSettingsShipmentCompanies(),
      getSettingsDestinationCompanies(),
    ]);

    // <<< CONSOLE LOG 6 (Check fetched data before passing)
    console.log(`[dashboard/page.tsx] Fetched Data Counts:`);
    console.log(`  - Cycles to Sample: ${cyclesToSample.length}`);
    console.log(`  - Cycles Ready for Loading: ${cyclesReadyForLoading.length}`); // Check this count
    console.log(`  - Cycles to Start Weighing: ${cyclesToStartWeighing.length}`);
    console.log(`  - In Progress Shipments: ${inProgressShipments.length}`);
    if (cyclesReadyForLoading.length > 0) {
        console.log('[dashboard/page.tsx] First cycle ready for loading (prop check):', JSON.stringify(cyclesReadyForLoading[0], null, 2));
    }


    const activeTransportCompanies = transportCompaniesAll.filter(c => c.is_active);
    const activeDestinationCompanies = destinationCompaniesAll.filter(c => c.is_active);

    return (
      <HarvestingDashboard
        cyclesToSample={cyclesToSample}
        cyclesToStartWeighing={cyclesToStartWeighing}
        cyclesReadyForLoading={cyclesReadyForLoading} // Pass data for Loading tab
        initialShipments={inProgressShipments}
        transportCompanies={activeTransportCompanies}
        destinationCompanies={activeDestinationCompanies}
      />
    );

  } else {
    // Growing mode
    const initialCycles: CropCycleForEmployee[] = [];
    return (
      <div className="p-4">
        <ClientPage initialCycles={initialCycles} />
      </div>
    );
  }
}