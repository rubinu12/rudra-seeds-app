import { notFound } from "next/navigation";
import { getChequePrintDetails } from "@/src/lib/payment-data";
import PrintChequeClient from "./PrintChequeClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{
    cycleId: string;
  }>;
};

export default async function PrintChequePage({ params }: Props) {
  // FIX: Await params first
  const { cycleId } = await params;
  const id = Number(cycleId);

  if (isNaN(id)) {
    notFound();
  }

  const printData = await getChequePrintDetails(id);

  if (!printData || !printData.cheques || printData.cheques.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <Link
          href={`/admin/payments/${id}/process`}
          className="inline-flex items-center text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payment Processing
        </Link>
        <h1 className="text-2xl font-semibold mb-4 text-red-600">
          Cheque Data Not Found
        </h1>
        <p className="text-slate-600">
          Could not retrieve valid cheque details for Cycle ID{" "}
          <span className="font-bold">{id}</span>. Please ensure payment
          has been processed correctly and the cycle status is &apos;paid&apos; or &apos;Cheque
          Generated&apos;.
        </p>
      </div>
    );
  }

  return (
    <PrintChequeClient printData={printData} />
  );
}