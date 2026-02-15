// src/app/admin/shipments/[id]/print/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  getShipmentBillData, 
  finalizeAndPrintBill 
} from "@/src/app/admin/actions/adminShipment";
import { LoaderCircle, Printer, ArrowLeft } from "lucide-react";
import { toast } from "sonner"; 

// --- Types ---
type BillRow = {
  farmer_name: string;
  village_name: string;
  lot_no: string;
  bags: number;
  weight: number;
  rate: number;
  amount: number;
};

type ShipmentBillData = {
  shipment: {
    shipment_id: number;
    vehicle_number: string;
    total_bags: number;
    driver_name: string;
    driver_mobile: string;
    dispatch_date: string | Date;
    location: string;
    dest_name: string;
    dest_address: string;
    dest_city: string;
    varieties: string[];
  };
  items: Array<{
    farmer_name: string;
    village_name: string;
    lot_no: string;
    bags: number;
    purchase_rate?: number; // [UPDATED] Added this field
  }>;
};

export default function ShipmentBillPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [shipmentData, setShipmentData] = useState<ShipmentBillData["shipment"] | null>(null);

  // --- Editable States ---
  const [rows, setRows] = useState<BillRow[]>([]);
  const [date, setDate] = useState<string>("");
  const [fromLoc, setFromLoc] = useState("Dhoraji");
  const [atCity, setAtCity] = useState("");
  const [fare, setFare] = useState("");
  const [driverLic, setDriverLic] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  // Initial Load
  useEffect(() => {
    if (id) {
      getShipmentBillData(id).then((res) => {
        if (res) {
          // Explicit cast to expected type to ensure safety
          const data = res as ShipmentBillData;
          setShipmentData(data.shipment);

          setDate(
            data.shipment.dispatch_date
              ? new Date(data.shipment.dispatch_date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          );
          setAtCity(data.shipment.dest_city || "");

          // [UPDATED] Calculation Logic
          const initialRows: BillRow[] = data.items.map((item) => {
             const weight = item.bags * 50;
             // Logic: DB Rate (per 20kg) / 20 = Rate per Kg. Default to 0 if missing.
             const ratePerKg = item.purchase_rate ? (Number(item.purchase_rate) / 20) : 0;
             
             return {
               ...item,
               weight: weight,
               rate: ratePerKg, 
               amount: weight * ratePerKg,
             };
          });
          setRows(initialRows);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleRateChange = (index: number, newRate: string) => {
    const rateVal = parseFloat(newRate) || 0;
    const newRows = [...rows];
    newRows[index].rate = rateVal;
    newRows[index].amount = newRows[index].weight * rateVal;
    setRows(newRows);
  };

  // --- SAVE & PRINT HANDLER ---
  const handlePrint = async () => {
    if (!shipmentData) return;
    
    // 1. Validate
    const grandTotal = rows.reduce((sum, row) => sum + row.amount, 0);
    if (grandTotal <= 0) {
        toast.error("Total amount cannot be zero.");
        return;
    }

    setIsSaving(true);

    // 2. Call Server Action to Update DB & Ledger
    const res = await finalizeAndPrintBill(
        shipmentData.shipment_id,
        grandTotal,
        date, 
        atCity 
    );

    if (res.success) {
        toast.success("Bill Saved & Ledger Updated!");
        
        // 3. Trigger Print (Small delay just to ensure state settles)
        setTimeout(() => {
            window.print();
            setIsSaving(false);
        }, 500);
    } else {
        toast.error(res.message || "Failed to save bill.");
        setIsSaving(false);
    }
  };

  if (loading || !shipmentData)
    return (
      <div className="h-screen flex items-center justify-center">
        <LoaderCircle className="animate-spin w-8 h-8 text-gray-400" />
      </div>
    );

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const grandTotalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  const varietyString =
    shipmentData.varieties && shipmentData.varieties.length > 0
      ? shipmentData.varieties.join(", ")
      : "N/A";

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white font-sans text-black">
      
      {/* CSS FIXES */}
      <style jsx global>{`
        /* Hide Number Spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }

        /* PRINT SPECIFIC RULES */
        @media print {
          @page {
            size: A4;
            margin: 0; 
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          [data-sonner-toaster], .sonner-toast, ol[data-sonner-toaster] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* --- NO PRINT CONTROLS --- */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {/* UPDATED PRINT BUTTON */}
          <button
            onClick={handlePrint}
            disabled={isSaving}
            className="bg-black text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-wait transition-all"
          >
            {isSaving ? (
                <> <LoaderCircle className="w-4 h-4 animate-spin" /> Saving... </>
            ) : (
                <> <Printer className="w-4 h-4" /> Print Bill </>
            )}
          </button>
        </div>
      </div>

      {/* --- A4 PAPER CONTAINER --- */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none p-[10mm] min-h-[297mm] print:min-h-0 print:h-screen print:w-full overflow-hidden text-sm relative leading-normal">
        {/* 1. TOP HEADER (Logo/Address) */}
        <div className="text-center border-b-2 border-black pb-2 mb-4">
          <h1 className="text-3xl font-black tracking-wider uppercase mb-1">
            RUDRA SEED & ORGANISER
          </h1>
          <p className="font-bold text-gray-800 text-xs">
            Shop No. 16, Nr. Sardar Chok, Jetpur Road, Dhoraji - 360 410
          </p>
          <p className="font-bold text-gray-800 text-xs">
            Denish Patel: Mo: 8154000459 | GST No: 24DNTPG8564E1ZL
          </p>
        </div>

        {/* 2. TITLE (Centered) */}
        <div className="text-center mb-[12mm]">
          <h2 className="text-xl font-black uppercase inline-block border-b-2 border-black tracking-wide">
            DISPATCH NOTE
          </h2>
        </div>

        {/* 3. INFO GRID (Perfectly Aligned) */}
        <div className="flex justify-between items-start mb-6 w-full">
          {/* LEFT: To & At */}
          <div className="w-1/2 text-left space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="font-bold w-6 text-sm">To:</span>
              <span className="font-bold text-base uppercase">
                {shipmentData.dest_name}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-bold w-6 text-sm">At:</span>
              <input
                value={atCity}
                onChange={(e) => setAtCity(e.target.value)}
                className="font-bold uppercase border-b border-dotted border-gray-400 w-full focus:outline-none focus:border-black print:border-none uppercase bg-transparent text-sm h-5"
                placeholder="CITY"
              />
            </div>
          </div>

          {/* RIGHT: From & Date */}
          <div className="w-1/2 text-right space-y-1.5">
            <div className="flex justify-end items-baseline gap-2">
              <span className="font-bold text-sm w-12 text-right">From:</span>
              <input
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="font-bold text-right w-24 border-b border-dotted border-gray-400 focus:outline-none focus:border-black print:border-none text-sm h-5"
              />
            </div>
            <div className="flex justify-end items-baseline gap-2">
              <span className="font-bold text-sm w-12 text-right">Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-bold text-right w-32 border-none focus:ring-0 p-0 bg-transparent font-sans text-sm h-5"
              />
            </div>
          </div>
        </div>

        {/* 4. SUBJECT & BODY */}
        <div className="mb-4 space-y-2 text-sm">
          <p className="font-bold border-b border-gray-300 pb-1 inline-block">
            Subject: Dispatch of Certified Seed Bags
          </p>

          <p className="mt-1">
            <span className="font-bold">Variety:</span> {varietyString}
          </p>

          <p className="text-justify leading-relaxed">
            Total <span className="font-bold">{shipmentData.total_bags}</span>{" "}
            certified seed bags of{" "}
            <span className="font-bold">{varietyString}</span> have been
            dispatched today ({date}) from{" "}
            <span className="font-bold">{fromLoc}</span> to your company,{" "}
            <span className="font-bold">{shipmentData.dest_name}</span> at{" "}
            <span className="font-bold uppercase">{atCity || "_______"}</span>.
          </p>

          <p className="text-xs italic text-gray-600">
            * This dispatch is carried out in accordance with the rules and
            standards of the Gujarat State Seed Certification Agency. Please
            accept delivery and handle it with care.
          </p>
          <p className="mt-2 font-bold underline text-xs">
            The list of sub-seed producers is as follows:
          </p>
        </div>

        {/* 5. TABLE (Full Width, Small Font) */}
        <table className="w-full border-collapse border border-black mb-6 text-center text-xs">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-100">
              <th className="border border-black p-1 w-8">Sr.</th>
              <th className="border border-black p-1 text-left pl-2">
                Sub Seed Producer Name
              </th>
              <th className="border border-black p-1 w-16">Lot No.</th>
              <th className="border border-black p-1 w-12">Bags</th>
              <th className="border border-black p-1 w-16">Weight (Kg)</th>
              <th className="border border-black p-1 w-16 bg-blue-50 print:bg-transparent">
                Rate (₹)
              </th>
              <th className="border border-black p-1 w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-black p-1">{idx + 1}</td>
                <td className="border border-black p-1 text-left pl-2 font-bold whitespace-nowrap">
                  {row.farmer_name}{" "}
                  <span className="text-[10px] font-normal text-gray-600 ml-1">
                    ({row.village_name})
                  </span>
                </td>
                <td className="border border-black p-1">{row.lot_no || "-"}</td>
                <td className="border border-black p-1">{row.bags}</td>
                <td className="border border-black p-1">{row.weight}</td>

                {/* RATE CELL */}
                <td className="border border-black p-0 bg-blue-50/30 print:bg-transparent">
                  <input
                    type="number"
                    step="0.01"
                    value={row.rate}
                    onChange={(e) => handleRateChange(idx, e.target.value)}
                    className="w-full h-full text-center bg-transparent focus:outline-none focus:bg-blue-100 font-medium"
                  />
                </td>

                <td className="border border-black p-1 text-right pr-2 font-medium">
                  {row.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            {/* TOTAL ROW */}
            <tr className="font-bold bg-gray-100 print:bg-gray-100">
              <td
                className="border border-black p-1.5 text-right pr-2"
                colSpan={3}
              >
                Total
              </td>
              <td className="border border-black p-1.5">
                {shipmentData.total_bags}
              </td>
              <td className="border border-black p-1.5">{totalWeight}</td>
              <td className="border border-black p-1.5">-</td>
              <td className="border border-black p-1.5 text-right pr-2 text-sm">
                {grandTotalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 6. FOOTER DETAILS BOX */}
        <div className="border border-black p-3 mb-10 text-xs font-medium">
          <div className="grid grid-cols-2 gap-x-16 gap-y-1.5">
            {/* Row 1 */}
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5">
              <span className="font-bold text-gray-700">HSN Code</span>
              <span className="font-bold">1207</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5">
              <span className="font-bold text-gray-700">Vehicle No.</span>
              <span className="font-bold uppercase">
                {shipmentData.vehicle_number}
              </span>
            </div>

            {/* Row 2 */}
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5">
              <span className="font-bold text-gray-700">Total Bags</span>
              <span className="font-bold">{shipmentData.total_bags}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5">
              <span className="font-bold text-gray-700">Driver Name</span>
              <span className="font-bold uppercase">
                {shipmentData.driver_name}
              </span>
            </div>

            {/* Row 3 */}
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5">
              <span className="font-bold text-gray-700">Total Weight</span>
              <span className="font-bold">{totalWeight} Kg</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5">
              <span className="font-bold text-gray-700">Driver Mobile</span>
              <span className="font-bold">{shipmentData.driver_mobile}</span>
            </div>

            {/* Row 4 */}
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5 items-center">
              <span className="font-bold text-gray-700">
                Vehicle Fare (₹) :
              </span>
              <input
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                className="font-bold text-right w-24 focus:outline-none border-none placeholder:text-gray-400 bg-transparent h-4"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between border-b border-dotted border-gray-400 pb-0.5 items-center">
              <span className="font-bold text-gray-700">Driver Lic. No :</span>
              <input
                value={driverLic}
                onChange={(e) => setDriverLic(e.target.value)}
                className="font-bold text-right w-32 focus:outline-none border-none placeholder:text-gray-300 bg-transparent h-4"
                placeholder="________________"
              />
            </div>
          </div>
        </div>

        {/* 7. SIGNATURES */}
        <div className="flex justify-between mt-auto px-12 pt-8">
          <div className="text-center w-40">
            <p className="font-bold border-t border-black pt-2 text-xs">
              Sender Signature
            </p>
          </div>
          <div className="text-center w-40">
            <p className="font-bold border-t border-black pt-2 text-xs">
              Receiver Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}