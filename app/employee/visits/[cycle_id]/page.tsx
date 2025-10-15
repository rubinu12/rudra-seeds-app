// app/employee/visits/[cycle_id]/page.tsx
import { getCycleForVisit } from '@/lib/growing-data';
import VisitForm from './VisitForm'; // We will create this client component next
import { notFound } from 'next/navigation';

type Props = {
  params: {
    cycle_id: string;
  };
};

export default async function VisitPage({ params }: Props) {
  const cycleId = Number(params.cycle_id);

  if (isNaN(cycleId)) {
    notFound();
  }
  
  // Fetch only the data that is truly dynamic for this page.
  const cycleData = await getCycleForVisit(cycleId);

  if (!cycleData) {
    notFound();
  }

  // Now, we only need to pass the cycle data to the client component.
  return (
    <VisitForm cycle={cycleData} />
  );
}