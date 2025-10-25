// app/employee/harvesting/sample/[cycle_id]/page.tsx
import { notFound } from 'next/navigation';
import { getCycleForHarvesting } from '@/lib/harvesting-data';
import SampleForm from './SampleForm';

type Props = {
  params: {
    cycle_id: string;
  };
  // *** ADDED searchParams prop ***
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function SamplePage({ params, searchParams }: Props) { // Added searchParams here
  const cycleId = Number(params.cycle_id);

  if (isNaN(cycleId)) {
    notFound();
  }

  const cycleData = await getCycleForHarvesting(cycleId);

  if (!cycleData) {
    notFound();
  }

  // --- Determine user role ---
  // Read from query param if coming from Admin, default to Employee otherwise
  const roleFromQuery = searchParams?.role;
  const userRole: 'Admin' | 'Employee' = roleFromQuery === 'Admin' ? 'Admin' : 'Employee';
  // ---

  return (
    <SampleForm
      cycle={cycleData}
      userRole={userRole} // Pass the determined role
    />
  );
}