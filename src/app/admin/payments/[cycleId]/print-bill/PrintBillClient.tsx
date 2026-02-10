// app/admin/payments/[cycleId]/print-bill/PrintBillClient.tsx
"use client";

import React, { useState } from "react";
import type {
  FarmerPaymentDetails,
  StoredChequeDetail,
} from "@/src/lib/payment-data";
import Link from "next/link";
import { Printer, ChevronsRight, ArrowLeft } from "lucide-react";

type PrintBillClientProps = {
  billData: FarmerPaymentDetails;
};

// Constants for company info
const COMPANY_INFO = {
  NAME: "રુદ્રા સીડ્સ & ઓર્ગેનાઇઝર",
  ADDRESS_LINE1: "જેતપુર રોડ, સરદાર ચોક પાસે, ધોરાજી - ૩૬૦૪૧૦",
  CONTACT: "સંપર્ક: ૮૧૫૪૦૦૦૪૫૯",
  GST: "24DNTPG8564E1ZL", // Example GST
};

export default function PrintBillClient({ billData }: PrintBillClientProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100); // Small delay for UI update
  };

  // Format dates (YYYY-MM-DD to DD/MM/YYYY)
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    try {
      // Check if the date string includes time, if so, split it
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-");
      // Ensure year, month, and day are valid numbers before formatting
      if (
        !year ||
        !month ||
        !day ||
        isNaN(Number(year)) ||
        isNaN(Number(month)) ||
        isNaN(Number(day))
      ) {
        return "Invalid Date";
      }
      return `${day}/${month}/${year}`;
    } catch {
      return "Invalid Date";
    }
  };

  const bags = billData.quantity_in_bags || 0;
  const ratePerMan = billData.purchase_rate || 0;
  const man = bags * 2.5; // 1 bag = 50kg, 1 man = 20kg => 1 bag = 2.5 man
  const grossAmount = billData.gross_payment || 0;
  const deduction = billData.amount_remaining || 0;
  const netAmount = billData.net_payment || 0;

  // *** CHANGE: Use cheque due date for the bill date ***
  // Assuming all cheques in the batch have the same due date, get it from the first one
  const billDate = formatDate(billData.cheque_details?.[0]?.due_date || null);
  // --- End Change ---

  const dispatchDate = formatDate(billData.dispatch_date);

  // Format currency without decimals for cleaner display in Rupees
  const formatRupees = (amount: number): string => {
    // Ensure amount is a number before formatting
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "N/A";
    return numAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const chequeNumbers = billData.cheque_details
    .map((c) => c.cheque_number)
    .join(", ");

  return (
    <>
      {/* Controls Section */}
      <div
        className={`controls p-4 max-w-4xl mx-auto my-4 border rounded shadow bg-white print:hidden ${isPrinting ? "invisible" : ""}`}
      >
        <h2 className="text-xl font-semibold mb-4 text-center">
          Farmer Payment Bill / Consent
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/admin/payments/${billData.crop_cycle_id}/process`}
            className="btn bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Payment
          </Link>
          <button
            onClick={handlePrint}
            className="btn bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Printer size={18} /> Print Bill
          </button>
          <Link
            href={`/admin/payments/${billData.crop_cycle_id}/print-cheque`}
            className="btn bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center gap-2"
          >
            Proceed to Print Cheque(s) <ChevronsRight size={18} />
          </Link>
        </div>
      </div>

      {/* Bill Rendering Section */}
      <div className="bill-container">
        <div className="bill-a4">
          {/* Header */}
          <div className="text-center mb-4 font-bold bill-header">
            <p className="text-lg">** {COMPANY_INFO.NAME} **</p>
            <p>{COMPANY_INFO.ADDRESS_LINE1}</p>
            <p>{COMPANY_INFO.CONTACT}</p>
            {COMPANY_INFO.GST && <p>GST No: {COMPANY_INFO.GST}</p>}
            <p className="text-md mt-2 underline">
              ** ખેડૂત બીજ ઉત્પાદન ચુકવણી પત્ર / સંમતિ પત્ર **
            </p>
          </div>

          {/* Farmer/Date Info */}
          <div className="flex justify-between mb-3 text-sm bill-info">
            <span>ખેડૂતનું નામ: {billData.farmer_name}</span>
            {/* *** CHANGE: Use billDate (derived from cheque due date) *** */}
            <span>તારીખ: {billDate}</span>
          </div>
          <div className="flex justify-between mb-3 text-sm bill-info">
            <span>ગામ: {billData.village_name || "N/A"}</span>
            <span>
              ગાડી નં./તારીખ: {billData.vehicle_number || "N/A"} /{" "}
              {dispatchDate}
            </span>
          </div>
          <div className="mb-4 text-sm bill-info">
            <span>વેરાયટી: {billData.seed_variety}</span>
          </div>

          {/* Calculation Table */}
          <table className="w-full border-collapse border border-black mb-4 text-sm bill-table">
            <thead>
              <tr className="font-bold">
                <th className="border border-black p-1">પાક</th>
                <th className="border border-black p-1">કટ્ટા (ગુણી)</th>
                <th className="border border-black p-1">મણ</th>
                <th className="border border-black p-1">ભાવ (₹/મણ)</th>
                <th className="border border-black p-1">રકમ (₹)</th>
                <th className="border border-black p-1">બિયારણ રકમ (₹)</th>
                <th className="border border-black p-1">ટોટલ રકમ (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">બીજ ઉત્પાદન</td>
                <td className="border border-black p-1 text-right">{bags}</td>
                <td className="border border-black p-1 text-right">
                  {man.toFixed(2)}
                </td>
                <td className="border border-black p-1 text-right">
                  ₹ {ratePerMan.toFixed(2)}
                </td>
                <td className="border border-black p-1 text-right">
                  ₹ {formatRupees(grossAmount)}
                </td>
                <td className="border border-black p-1 text-right">
                  ₹ {formatRupees(deduction)}
                </td>
                <td className="border border-black p-1 text-right">
                  ₹ {formatRupees(netAmount)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={6}
                  className="border border-black p-1 text-right font-bold"
                >
                  ફાઇનલ રકમ (₹):
                </td>
                <td className="border border-black p-1 text-right font-bold">
                  ₹ {formatRupees(netAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Cheque Details Table */}
          <div className="mb-4 text-sm font-bold">ચુકવણી વિગત:</div>
          <div className="mb-2 text-sm">
            નીચે મુજબના ચેક દ્વારા ચુકવણી કરેલ છે:
          </div>
          <table className="w-full border-collapse border border-black mb-4 text-sm bill-table">
            <thead>
              <tr className="font-bold">
                <th className="border border-black p-1 w-[5%]">ક્રમ</th>
                <th className="border border-black p-1 w-[20%]">ચેક નંબર</th>
                <th className="border border-black p-1">
                  બેંક ખાતા ધારકનું નામ (Payee Name)
                </th>
                <th className="border border-black p-1 w-[15%]">રકમ (₹)</th>
                <th className="border border-black p-1 w-[15%]">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {billData.cheque_details.map((cheque, index) => (
                <tr key={index}>
                  <td className="border border-black p-1 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-black p-1">
                    {cheque.cheque_number}
                  </td>
                  <td className="border border-black p-1">
                    {cheque.payee_name}
                  </td>
                  <td className="border border-black p-1 text-right">
                    ₹ {formatRupees(cheque.amount)}
                  </td>
                  {/* *** CHANGE: Use formatDate on cheque.due_date *** */}
                  <td className="border border-black p-1 text-center">
                    {formatDate(cheque.due_date)}
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  colSpan={3}
                  className="border border-black p-1 text-right font-bold"
                >
                  કુલ ચેક રકમ (₹):
                </td>
                <td className="border border-black p-1 text-right font-bold">
                  ₹ {formatRupees(netAmount)}
                </td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          {/* Consent Text */}
          <div className="mb-6 text-sm consent-text">
            <p className="font-bold underline mb-1">જાહેરાત/સંમતિ:</p>
            <p>
              હું, નીચે સહી કરનાર ખેડૂત શ્રી {billData.farmer_name}, જાહેર કરું
              છું કે ઉપરોક્ત બીજ ઉત્પાદન કાર્યક્રમ અંતર્ગત થયેલ હિસાબ અને ઉપર
              દર્શાવેલ ચેક નં. {chequeNumbers} વાળા, કુલ રકમ ₹{" "}
              {formatRupees(netAmount)} ના ચેક(કો) મને મળી ગયેલ છે, જે મને
              સંતોષકારક છે. હવે આ હિસાબ બાબતે મારો કોઇપણ જાતનો દાવો રહેતો નથી,
              અને મને આપેલ ચેક ની સંપૂર્ણ જવાબદારી મારી રેહસે. જેની નોંધ લેશો.
            </p>
            <p className="mt-2">
              (નોંધ: રુદ્ર સીડ્સ એકાઉન્ટ પે ચેક થી જ ચુકવણું કરશે.)
            </p>
          </div>

          {/* Signature Area */}
          <div className="flex justify-between mt-12 pt-8 text-sm signature-area">
            <span>ખેડૂત ની સહી</span>
            <span>રુદ્ર સીડ્સ વતી</span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        .controls {
          /* Standard button styling from previous component */
        }
        .btn {
          /* Basic button styling */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 9999px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .bill-container {
          margin: 20px auto;
          padding: 10px;
          border: 1px dashed #ccc; /* Dashed border for screen view */
          width: 210mm; /* A4 width */
          background: white;
        }
        .bill-a4 {
          width: 190mm; /* Content width slightly less than A4 */
          min-height: 277mm; /* Minimum height */
          margin: 0 auto; /* Center content */
          padding: 10mm 5mm; /* Margins inside the dashed border */
          font-family: Arial, sans-serif; /* Use a common font */
          color: black;
        }
        .bill-header p {
          margin-bottom: 2px;
          line-height: 1.3;
        }
        .bill-info span {
          display: inline-block;
          min-width: 45%;
        } /* Basic layout for info lines */
        .bill-table th,
        .bill-table td {
          text-align: left;
          vertical-align: top;
        }
        .bill-table .text-right {
          text-align: right;
        }
        .bill-table .text-center {
          text-align: center;
        }
        .consent-text p {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        .signature-area {
          border-top: 1px solid #ccc;
          padding-top: 5px;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            font-size: 10pt;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .controls {
            display: none !important;
          }
          .bill-container {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            width: auto !important;
          }
          /* Make ONLY the bill div visible */
          body > *:not(.bill-container) {
            display: none;
          }
          html,
          body {
            height: auto;
          } /* Allow content height */
          .bill-a4 {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm; /* Ensure full A4 width */
            height: 297mm; /* Ensure full A4 height */
            margin: 0 !important;
            padding: 10mm !important; /* Standard A4 margins */
            border: none !important;
            box-shadow: none !important;
            font-size: 10pt; /* Adjust font size for print if needed */
          }
          .bill-table th,
          .bill-table td {
            border-color: black !important;
            padding: 3px 5px;
          }
          .bill-info span {
            min-width: 48%;
          } /* Adjust spacing slightly for print */
          .signature-area {
            border-top: 1px solid black;
          }
        }

        @page {
          size: A4;
          margin: 0; /* Remove browser default margins */
        }
      `}</style>
    </>
  );
}
