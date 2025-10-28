// app/admin/shipments/[shipmentId]/bill/page.tsx
import { notFound } from 'next/navigation';
import { getShipmentBillDetails } from '@/lib/shipment-data'; // Adjust path if needed
import ShipmentBillForm from './ShipmentBillForm'; // We will create this next

type Props = {
  params: {
    shipmentId: string;
  };
};

export default async function ShipmentBillPage({ params }: Props) {
  const shipmentId = Number(params.shipmentId);

  if (isNaN(shipmentId)) {
    notFound(); // Invalid ID format
  }

  // Fetch data on the server
  const billData = await getShipmentBillDetails(shipmentId);

  if (!billData) {
    notFound(); // Shipment not found or error occurred
  }

  // Optional: Check if shipment status allows bill generation (e.g., must be 'Dispatched')
  // if (billData.status !== 'Dispatched' && billData.status !== 'Billed') {
  //   return <div className="p-8 text-center text-error">Cannot generate bill for shipment with status: {billData.status}</div>;
  // }

  return (
    // We'll add layout/padding later, focus on passing data first
    <div>
      {/* Pass fetched data to the client component */}
      <ShipmentBillForm initialBillData={billData} />
    </div>
  );
}