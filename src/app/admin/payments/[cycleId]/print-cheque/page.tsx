// app/admin/payments/[cycleId]/print-cheque/page.tsx
import { notFound } from "next/navigation";
import { getChequePrintDetails } from "@/src/lib/payment-data"; // Adjust path if needed
import PrintChequeClient from "./PrintChequeClient"; // Client component (to be created)
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: {
    cycleId: string;
  };
};

export default async function PrintChequePage({ params }: Props) {
  const cycleId = Number(params.cycleId);

  if (isNaN(cycleId)) {
    notFound();
  }

  // Fetch cheque data on the server
  const printData = await getChequePrintDetails(cycleId);

  if (!printData || !printData.cheques || printData.cheques.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <Link
          href={`/admin/payments/${cycleId}/process`}
          className="inline-flex items-center text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payment Processing
        </Link>
        <h1 className="text-2xl font-semibold mb-4 text-error">
          Cheque Data Not Found
        </h1>
        <p className="text-on-surface-variant">
          Could not retrieve valid cheque details for Cycle ID{" "}
          <span className="font-bold">{cycleId}</span>. Please ensure payment
          has been processed correctly and the cycle status is 'Cheque
          Generated'.
        </p>
      </div>
    );
  }

  return (
    // Pass fetched data to the client component
    // No extra layout needed here as the client component handles everything including print styles
    <PrintChequeClient printData={printData} />
  );
}
