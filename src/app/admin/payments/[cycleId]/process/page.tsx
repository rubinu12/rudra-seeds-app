import { notFound } from "next/navigation";
import { getFarmerPaymentDetails } from "@/src/lib/payment-data";
import ProcessPaymentForm from "./ProcessPaymentForm";
import Link from "next/link";
import { ArrowLeft, Ban } from "lucide-react";
import { sql } from "@vercel/postgres"; // [NEW] Standard import for Server Components

type Props = {
  params: Promise<{
    cycleId: string;
  }>;
};

// [NEW] Type Definition for Bank Accounts
export type SimplifiedBankAccount = {
  account_id: number;
  account_name: string; // This is the Payee Name
  bank_name: string;
  account_no: string;
};

export default async function ProcessPaymentPage({ params }: Props) {
  const { cycleId } = await params;
  const id = Number(cycleId);

  if (isNaN(id)) {
    notFound();
  }

  const paymentDetails = await getFarmerPaymentDetails(id);

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Cannot Process Payment
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Cycle{" "}
            <span className="font-mono font-bold bg-slate-100 px-1 rounded">
              #{id}
            </span>{" "}
            could not be retrieved.
          </p>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // [NEW] Fetching Payee Names (Bank Accounts) from DB
  // Logic: Get accounts where farmer_id matches the one in this cycle
  let farmerBankAccounts: SimplifiedBankAccount[] = [];
  try {
    const bankRes = await sql<SimplifiedBankAccount>`
      SELECT account_id, account_name, bank_name, account_no 
      FROM bank_accounts 
      WHERE farmer_id = (SELECT farmer_id FROM crop_cycles WHERE crop_cycle_id = ${id})
    `;
    farmerBankAccounts = bankRes.rows;
  } catch (e) {
    console.error("Failed to fetch bank accounts", e);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center text-slate-500 hover:text-slate-800 font-bold text-sm mb-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Cancel & Return
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Farmer Payment
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Cycle Reference
              </p>
              <p className="text-sm font-bold text-slate-900">
                #{paymentDetails.crop_cycle_id} • {paymentDetails.lot_no}
              </p>
            </div>
          </div>
        </div>

        {/* [UPDATED] Passing the fetched bank accounts to the form */}
        <ProcessPaymentForm 
          paymentDetails={paymentDetails} 
          farmerBankAccounts={farmerBankAccounts} 
        />
      </div>
    </div>
  );
}