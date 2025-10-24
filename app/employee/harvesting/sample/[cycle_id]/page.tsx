// app/employee/harvesting/sample/[cycle_id]/page.tsx
import { notFound } from 'next/navigation';
import { getCycleForHarvesting } from '@/lib/harvesting-data'; // We will create this new function next
import SampleForm from './SampleForm'; // We will create this client component next

type Props = {
  params: {
    cycle_id: string;
  };
};

export default async function SamplePage({ params }: Props) {
  const cycleId = Number(params.cycle_id);

  if (isNaN(cycleId)) {
    notFound();
  }

  // This new function will fetch all the details we need for the form.
  const cycleData = await getCycleForHarvesting(cycleId);

  if (!cycleData) {
    notFound();
  }

  // For now, we'll assume the user is an 'Employee'.
  // In a real app, this would come from an authentication session.
  const userRole = 'Employee';

  // Pass the complete cycle data object and user role to the client component.
  return (
    <SampleForm
      cycle={cycleData}
      userRole={userRole}
    />
  );
}