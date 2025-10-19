// app/employee/dashboard/page.tsx
import { getEmployeeMode } from '@/app/admin/settings/data';
import HarvestingDashboard from '@/app/employee/harvesting/HarvestingDashboard';
import ClientPage from './ClientPage';
import { CropCycleForEmployee } from '@/lib/definitions';

export default async function EmployeeDashboardPage() {
  // 1. First, check the current application mode set by the admin.
  const currentMode = await getEmployeeMode();

  // 2. Conditionally render the correct dashboard based on the mode.
  if (currentMode === 'Harvesting') {
    // If in Harvesting mode, render the new HarvestingDashboard component.
    // The dashboard itself will handle fetching its own "to-do" lists or search results.
    return (
      <HarvestingDashboard />
    );

  } else {
    // Otherwise, keep the default "Growing" mode behavior.
    const initialCycles: CropCycleForEmployee[] = [];

    return (
      <div className="p-4">
        <ClientPage
          initialCycles={initialCycles}
        />
      </div>
    );
  }
}