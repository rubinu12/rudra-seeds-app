// app/admin/payments/[cycleId]/print-bill/page.tsx
import { notFound } from "next/navigation";
import { getFarmerPaymentDetails } from "@/src/lib/payment-data"; // Use the updated function
import PrintBillClient from "./PrintBillClient"; // Client component (to be created next)
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: {
    cycleId: string;
  };
};

export default async function PrintBillPage({ params }: Props) {
  const cycleId = Number(params.cycleId);

  if (isNaN(cycleId)) {
    notFound();
  }

  // Fetch data using the updated function
  const billData = await getFarmerPaymentDetails(cycleId);

  // Handle case where data isn't found or status isn't 'Cheque Generated'
  if (!billData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        {/* Link back to process page might be more relevant if data fetch failed */}
        <Link
          href={`/admin/payments/${cycleId}/process`}
          className="inline-flex items-center text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payment Processing
        </Link>
        <h1 className="text-2xl font-semibold mb-4 text-error">
          Bill Data Not Found
        </h1>
        <p className="text-on-surface-variant">
          Could not retrieve details needed for the bill for Cycle ID{" "}
          <span className="font-bold">{cycleId}</span>. Please ensure payment
          has been processed correctly.
        </p>
      </div>
    );
  }

  // Check if status is specifically 'Cheque Generated' if required by business logic
  // (getFarmerPaymentDetails already allows 'Loaded' or 'Cheque Generated')
  /*
  const cycleStatus = await getCycleStatus(cycleId); // Hypothetical function
  if (cycleStatus !== 'Cheque Generated') {
     return ( ... error message ... );
  }
  */

  return (
    // Pass fetched data to the client component
    // No extra layout needed here as the client component handles everything including print styles
    <PrintBillClient billData={billData} />
  );
}
