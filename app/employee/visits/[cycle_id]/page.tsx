// app/employee/visits/[cycle_id]/page.tsx
import { getCycleForVisit } from '@/lib/growing-data';
import VisitForm from './VisitForm';
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
  
  // Fetch the extended data for this page using our updated function.
  // This now includes landmark, sowing_date, variety, etc.
  const cycleData = await getCycleForVisit(cycleId);

  if (!cycleData) {
    notFound();
  }

  // Pass the complete cycle data object to the client component.
  return (
    <VisitForm cycle={cycleData} />
  );
}