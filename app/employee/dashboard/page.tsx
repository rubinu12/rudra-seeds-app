// app/employee/dashboard/page.tsx
import ClientPage from './ClientPage';
// Import the type from our single source of truth
import { CropCycleForEmployee } from '@/lib/definitions';

export default async function EmployeeDashboardPage() {
  // Explicitly type the empty array to tell TypeScript it's an
  // array of CropCycleForEmployee objects. This resolves the error.
  const initialCycles: CropCycleForEmployee[] = [];

  return (
    <div className="p-4">
      <ClientPage 
        initialCycles={initialCycles} 
      />
    </div>
  );
}