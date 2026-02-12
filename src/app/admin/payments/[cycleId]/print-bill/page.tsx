import { notFound } from "next/navigation";
import { getFarmerPaymentDetails } from "@/src/lib/payment-data";
import PrintBillClient from "./PrintBillClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{
    cycleId: string;
  }>;
};

export default async function PrintBillPage({ params }: Props) {
  // FIX: Await params first (Next.js 15 requirement)
  const { cycleId } = await params;
  const id = Number(cycleId);

  if (isNaN(id)) {
    notFound();
  }

  const billData = await getFarmerPaymentDetails(id);

  if (!billData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <Link
          href={`/admin/payments/${id}/process`}
          className="inline-flex items-center text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payment Processing
        </Link>
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Bill Data Not Found
        </h1>
        <p className="text-slate-600">
          Could not retrieve details needed for the bill for Cycle ID <span className="font-bold">{id}</span>. 
          Please ensure payment has been processed correctly.
        </p>
      </div>
    );
  }

  return (
    <PrintBillClient billData={billData} />
  );
}