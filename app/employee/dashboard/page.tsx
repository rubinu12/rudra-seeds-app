// app/employee/dashboard/page.tsx
import { getAssignedCycles, getFertilizerOptions, getDiseaseOptions } from '@/lib/growing-data';
import { getLandmarks } from '@/lib/data'; // Assuming landmarks are in the general data file
import ClientPage from './ClientPage';

export default async function EmployeeDashboardPage() {
  // Fetch all necessary data on the server
  const assignedCycles = await getAssignedCycles();
  const landmarks = await getLandmarks();
  // We can pre-fetch these for the filter pop-ups
  // const seedVarieties = await getSeedVarieties(); 

  return (
    <div className="p-4">
      {/* We pass the server-fetched data to a Client Component. 
        This is a standard and performant pattern in Next.js.
      */}
      <ClientPage 
        initialCycles={assignedCycles} 
        landmarks={landmarks}
      />
    </div>
  );
}