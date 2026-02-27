// src/app/admin/shipments/[id]/print/PrintDocumentClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Printer, Save, LoaderCircle } from "lucide-react";
import { finalizeAndPrintBill } from "@/src/app/admin/actions/adminShipment";

function amountToWords(amount: number): string {
  if (amount === 0) return "Zero";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const n = ("000000000" + Math.round(amount).toString()).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  let str = "";
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0] as any] + " " + a[n[1][1] as any]) + "Crore " : "";
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0] as any] + " " + a[n[2][1] as any]) + "Lakh " : "";
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0] as any] + " " + a[n[3][1] as any]) + "Thousand " : "";
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0] as any] + " " + a[n[4][1] as any]) + "Hundred " : "";
  str += (Number(n[5]) != 0) ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0] as any] + " " + a[n[5][1] as any]) : "";
  return str.trim() + " Only";
}

export default function PrintDocumentClient({ shipment, items }: { shipment: any; items: any[] }) {
  const [isPending, startTransition] = useTransition();

  const [docType, setDocType] = useState<"INVOICE" | "DELIVERY CHALLAN" | "BOTH">("BOTH");
  const [packSize, setPackSize] = useState<number>(50);
  const [transportRate, setTransportRate] = useState<number>(0);
  const [dispatchFrom, setDispatchFrom] = useState<string>(shipment.dispatch_from || "Dhoraji");
  const [destinationCity, setDestinationCity] = useState<string>(shipment.dest_city || "Destination City");
  const [paymentTerms, setPaymentTerms] = useState<string>("Within 7 days of seeds received");
  const [deliveryTerms, setDeliveryTerms] = useState<string>("Buyer will arrange the transportation from farmer's field/godown to delivery location");
  
  const companyFirstWord = shipment.dest_name ? shipment.dest_name.split(' ')[0].toUpperCase() : 'RS';
  const currentYear = new Date().getFullYear();
  const generatedInvoiceNo = `${companyFirstWord}-SW-${shipment.shipment_id}-${currentYear}`;
  const [invoiceNo, setInvoiceNo] = useState<string>(shipment.invoice_number || generatedInvoiceNo);

  const availableShipAddresses: string[] = Array.isArray(shipment.ship_to_addresses) 
    ? shipment.ship_to_addresses 
    : [];
    
  const [selectedShipTo, setSelectedShipTo] = useState<string>(
    shipment.saved_ship_to || availableShipAddresses[0] || "No delivery address selected"
  );

  const [rates, setRates] = useState<number[]>(
    items.map(item => item.purchase_rate ? Number((item.purchase_rate / 20).toFixed(2)) : 0)
  );

  const handleRateChange = (index: number, newRate: number) => {
    const newRates = [...rates];
    newRates[index] = newRate;
    setRates(newRates);
  };

  const totalBags = items.reduce((sum, item) => sum + Number(item.bags), 0);
  const totalQty = totalBags * packSize;
  const totalAmount = items.reduce((sum, item, index) => sum + (Number(item.bags) * packSize * rates[index]), 0);

  // SAVE TO DATABASE
  const handleSaveOnly = () => {
    startTransition(async () => {
        const result = await finalizeAndPrintBill(
            shipment.shipment_id, totalAmount, new Date().toISOString(),
            destinationCity, invoiceNo, dispatchFrom, selectedShipTo
        );
        if (result.success) {
            alert("Data saved successfully!");
        } else {
            alert("Failed to save bill data.");
        }
    });
  };

  // PRINT (Native Vector PDF generation)
  const handlePrint = () => {
    // Trick the browser so the "Save as PDF" dialog suggests the correct file name
    const originalTitle = document.title;
    const suffix = docType === "BOTH" ? "INVOICE_AND_DC" : docType;
    document.title = `${invoiceNo}_${suffix}`; 
    
    window.print();
    
    // Restore title
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  const sharedData = { shipment, items, packSize, transportRate, dispatchFrom, destinationCity, paymentTerms, deliveryTerms, invoiceNo, selectedShipTo, rates, handleRateChange, totalBags, totalQty, totalAmount };

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0 font-sans text-black">
      
      {/* GLOBAL PRINT CSS: Enforces exactly A4 sizing & forces page break between Invoice and DC */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
      `}} />

      {/* --- NON-PRINTABLE SETTINGS PANEL --- */}
      <div className="max-w-[210mm] mx-auto mb-6 bg-white p-5 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden border border-gray-300">
        <div className="md:col-span-3 pb-3 border-b flex justify-between items-center">
            <h2 className="font-bold text-xl text-gray-800 tracking-tight">Document Configuration</h2>
            <div className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-100 shadow-sm">
                Shipment #{shipment.shipment_id}
            </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">View Layout</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value as any)} className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none font-bold bg-green-50 focus:ring-2 focus:ring-green-500">
            <option value="INVOICE">Invoice Only</option>
            <option value="DELIVERY CHALLAN">Delivery Challan Only</option>
            <option value="BOTH">View & Print BOTH (2 Pages)</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Document No.</label>
          <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none bg-blue-50 font-mono font-bold focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Pack Size (Kg)</label>
          <input type="number" value={packSize} onChange={(e) => setPackSize(Number(e.target.value))} className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-3 grid grid-cols-3 gap-5">
            <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Dispatch Origin</label>
                <input type="text" value={dispatchFrom} onChange={(e) => setDispatchFrom(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Destination City</label>
                <input type="text" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Transport Freight (₹)</label>
                <input type="number" value={transportRate} onChange={(e) => setTransportRate(Number(e.target.value))} className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
        </div>

        <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Select Consignee (Ship-To Address)</label>
            <select 
                value={selectedShipTo} 
                onChange={(e) => setSelectedShipTo(e.target.value)} 
                className="border border-gray-300 rounded-lg p-2 text-sm w-full outline-none bg-orange-50 font-medium focus:ring-2 focus:ring-orange-500"
            >
                {availableShipAddresses.map((addr, idx) => (
                    <option key={idx} value={addr}>{addr.substring(0, 150)}...</option>
                ))}
                {availableShipAddresses.length === 0 && <option value="N/A">No addresses found</option>}
            </select>
        </div>

        {/* SEPARATE SAVE AND PRINT BUTTONS */}
        <div className="md:col-span-3 border-t pt-4 flex justify-end gap-3 mt-1">
            <button 
                onClick={handleSaveOnly} 
                disabled={isPending}
                className="bg-white border-2 border-indigo-600 text-indigo-700 px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-sm hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
                {isPending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {isPending ? "Saving..." : "Save to Database"}
            </button>
            <button 
                onClick={handlePrint} 
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors"
            >
                <Printer className="w-5 h-5" /> 
                {docType === "BOTH" ? "Print / Save Both as PDF" : "Print Document"}
            </button>
        </div>
      </div>

      {/* --- A4 PREVIEWS --- */}
      <div className="flex flex-col gap-10 print:gap-0 items-center">
         {(docType === "INVOICE" || docType === "BOTH") && (
            <div className="w-[210mm] shadow-2xl print:shadow-none bg-white">
              <InvoiceTemplate {...sharedData} />
            </div>
         )}
         
         {/* PAGE BREAK (Only visible during physical print or "Save as PDF") */}
         {docType === "BOTH" && <div className="page-break hidden print:block"></div>}
         
         {(docType === "DELIVERY CHALLAN" || docType === "BOTH") && (
            <div className="w-[210mm] shadow-2xl print:shadow-none bg-white">
              <DCTemplate {...sharedData} />
            </div>
         )}
      </div>

    </div>
  );
}

// ============================================================================
// TEMPLATE 1: INVOICE A4 PAGE
// ============================================================================
function InvoiceTemplate({ shipment, items, packSize, transportRate, dispatchFrom, destinationCity, paymentTerms, deliveryTerms, invoiceNo, selectedShipTo, rates, handleRateChange, totalBags, totalQty, totalAmount }: any) {
  return (
    <div className="w-[210mm] h-[296mm] mx-auto bg-white p-[10mm] text-[13px] leading-[1.4] box-border relative flex flex-col overflow-hidden text-black">
        <div className="border-2 border-black w-full flex flex-col h-fit">
          <div className="text-center font-bold text-[18px] border-b-2 border-black py-2 tracking-widest uppercase bg-gray-100 print:bg-transparent">
            INVOICE
          </div>
          <div className="flex border-b-2 border-black">
            <div className="w-1/2 border-r-2 border-black p-2.5 flex flex-col">
              <p className="font-bold underline mb-1 text-[12px]">Supplier</p>
              <p className="font-extrabold text-[16px] uppercase tracking-wide">Rudra Seeds & Organiser</p>
              <p>At. Nr. Sardar Chock , Jetpur Road, Dhoraji, Dist. Rajkot, Gujarat - 360410</p>
              <p>Contact: +91 8154000459</p>
              <p>PAN NO.: DNTPG8564E</p>
              <p className="font-bold mt-1 text-[14px]">GSTIN: 24DNTPG8564E1ZL</p>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="flex border-b-2 border-black">
                <div className="w-1/2 border-r-2 border-black p-2.5">
                  <p className="text-[12px]">Invoice No.</p>
                  <p className="font-bold text-[14px]">{invoiceNo}</p>
                </div>
                <div className="w-1/2 p-2.5">
                  <p className="text-[12px]">Dated</p>
                  <p className="font-bold text-[14px]">
                      {shipment.dispatch_date ? new Date(shipment.dispatch_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
              <div className="flex border-b-2 border-black">
                <div className="w-1/2 border-r-2 border-black p-2.5">
                  <p className="text-[12px]">Dispatch From</p>
                  <p className="font-bold text-[14px]">{dispatchFrom}</p>
                </div>
                <div className="w-1/2 p-2.5">
                  <p className="text-[12px]">Destination</p>
                  <p className="font-bold text-[14px]">{destinationCity}</p>
                </div>
              </div>
              <div className="p-2.5 flex-grow">
                <p className="text-[12px]"><span className="font-bold">Terms of Payment:</span> {paymentTerms}</p>
                <p className="text-[12px] mt-1"><span className="font-bold">Terms of Delivery:</span> {deliveryTerms}</p>
              </div>
            </div>
          </div>
          <div className="flex border-b-2 border-black min-h-[40mm]">
            <div className="w-1/2 border-r-2 border-black p-2.5 flex flex-col">
              <p className="font-bold underline mb-1 text-[12px]">Buyer (Bill to)</p>
              <p className="font-bold text-[15px] uppercase">{shipment.dest_name}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{shipment.dest_address}</p>
              <p>{shipment.dest_city}</p>
              <div className="mt-2 text-[13px]">
                {shipment.gst_no && <p><span className="font-bold">GST NO:</span> {shipment.gst_no}</p>}
                {shipment.dest_mobile && <p><span className="font-bold">Mobile no:</span> {shipment.dest_mobile}</p>}
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="p-2.5 border-b-2 border-black flex-grow">
                <p className="font-bold underline mb-1 text-[12px]">Consignee (Ship to)</p>
                <p className="whitespace-pre-wrap font-semibold text-[13px] leading-relaxed">{selectedShipTo}</p>
              </div>
              <div className="p-2.5">
                <p className="font-bold text-[14px] uppercase">{shipment.transport_name}</p>
                <div className="flex justify-between items-end mt-1">
                    <p className="font-bold text-[13px]">Truck No.: {shipment.vehicle_number}</p>
                    <p className="text-[12px] bg-gray-100 px-2 py-1 border border-gray-300 print:border-none print:bg-transparent font-bold">
                        Freight: ₹ {transportRate.toLocaleString('en-IN')}
                    </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                {/* WIDENED COLUMNS TO FIX AMOUNT OVERLAP - TOTAL EQUALS 100% */}
                <tr className="border-b-2 border-black bg-gray-100 print:bg-transparent">
                  <th className="border-r border-black p-2 font-bold w-[5%] text-center">Sr.<br/>No.</th>
                  <th className="border-r border-black p-2 font-bold w-[18%] text-left">Farmer Name</th>
                  <th className="border-r border-black p-2 font-bold w-[18%] text-left">Item Name</th>
                  <th className="border-r border-black p-2 font-bold w-[13%] text-center">Lot No.</th>
                  <th className="border-r border-black p-2 font-bold w-[8%] text-center">Bags<br/><span className="font-normal text-[10px]">({packSize} Kg)</span></th>
                  <th className="border-r border-black p-2 font-bold w-[10%] text-center">Qty (Kg)</th>
                  <th className="border-r border-black p-2 font-bold w-[10%] text-center">Rate</th>
                  <th className="p-2 font-bold w-[18%] text-right pr-2">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="align-top border-b border-black last:border-b-0">
                    <td className="border-r border-black p-2 text-center">{index + 1}</td>
                    <td className="border-r border-black p-2 text-left font-bold">{item.farmer_name}</td>
                    <td className="border-r border-black p-2 font-bold">SW-{item.variety_name}</td>
                    <td className="border-r border-black p-2 text-center font-mono text-[11px] font-semibold">{item.lot_no}</td>
                    <td className="border-r border-black p-2 text-center font-semibold">{item.bags}</td>
                    <td className="border-r border-black p-2 text-center font-bold">{(Number(item.bags) * packSize).toFixed(2)}</td>
                    <td className="border-r border-black p-0 text-center">
                        <input type="number" value={rates[index]} onChange={(e) => handleRateChange(index, Number(e.target.value))} className="w-full h-full text-center bg-yellow-50 outline-none print:appearance-none text-[13px] py-2 font-bold print:bg-transparent" step="0.01" />
                    </td>
                    <td className="p-2 text-right font-bold pr-2">{(Number(item.bags) * packSize * rates[index]).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex border-t-2 border-b-2 border-black bg-gray-100 print:bg-transparent font-bold items-center min-h-[10mm] text-[14px]">
             <div className="w-[54%] border-r border-black p-2 text-right uppercase tracking-wider">Total</div>
             <div className="w-[8%] border-r border-black p-2 text-center">{totalBags}</div>
             <div className="w-[10%] border-r border-black p-2 text-center">{totalQty.toFixed(2)} KG.</div>
             <div className="w-[10%] border-r border-black p-2 text-center"></div>
             <div className="w-[18%] p-2 text-right pr-2">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="border-b border-black p-2.5 flex justify-between items-center min-h-[10mm]">
            <div>
              <p className="text-[13px]"><span className="font-bold">Amount Chargeable (in words):</span> INR {amountToWords(totalAmount)}</p>
            </div>
            <div>
               <span className="font-bold italic text-[12px]">E. & O.E</span>
            </div>
          </div>
          <div className="border-b-2 border-black p-2.5 min-h-[8mm]">
              <span className="font-bold text-[13px]">HSN/SAC Code: 10019010</span>
          </div>

          <div className="flex min-h-[45mm]">
            <div className="w-1/2 border-r-2 border-black p-2.5 flex flex-col justify-between text-[11px] leading-relaxed">
              <p>
                <span className="font-bold underline text-[12px]">Declaration:</span><br/>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Tax free seeds. Hence, no e-way bill is required to be generated as the goods covered under this delivery challan are exempt from tax as per Rule 138 (14), under notification No. 7/2017 Central Tax (Rate) dated 28 June 2017.
              </p>
              <div className="mt-6 flex flex-col items-center w-[60%]">
                  <span className="font-bold text-[14px] mb-8">Receiver's Signature</span>
                  <span className="text-[10px] font-normal border-t border-gray-400 w-full text-center pt-1">(Receive in Good Condition)</span>
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="border-b-2 border-black p-2.5 flex-grow">
                <p className="font-bold underline text-[12px] mb-1.5">Company's Bank Details</p>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 text-[12px] leading-loose">
                  <span className="font-bold">Bank Name</span><span>: Union Bank of of India</span>
                  <span className="font-bold">A/c No.</span><span className="font-bold">: 314401010035162</span>
                  <span className="font-bold">Branch</span><span>: Dhoraji - Stationroad Branch</span>
                  <span className="font-bold">IFSC</span><span>: UBIN0531448</span>
                </div>
              </div>
              <div className="p-3 flex flex-col justify-between items-end min-h-[22mm]">
                 <p className="font-bold text-[13px]">for Rudra Seeds & Organiser</p>
                 <p className="font-bold text-[13px] mt-auto">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE 2: DELIVERY CHALLAN A4 PAGE
// ============================================================================
function DCTemplate({ shipment, items, packSize, dispatchFrom, destinationCity, invoiceNo, selectedShipTo, rates, handleRateChange, totalBags, totalQty, totalAmount }: any) {
  return (
    <div className="w-[210mm] h-[296mm] mx-auto bg-white p-[10mm] text-[13px] leading-[1.4] box-border relative flex flex-col overflow-hidden text-black">
        <div className="border-2 border-black w-full flex flex-col h-fit">
          <div className="text-center font-bold text-[18px] border-b-2 border-black py-2 tracking-widest uppercase bg-gray-100 print:bg-transparent">
            DELIVERY CHALLAN
          </div>
          <div className="flex border-b-2 border-black min-h-[40mm]">
            <div className="w-1/2 border-r-2 border-black p-2.5 flex flex-col">
              <p className="font-bold underline mb-1 text-[12px]">Supplier</p>
              <p className="font-extrabold text-[16px] uppercase tracking-wide">Rudra Seeds & Organiser </p>
              <p>At. Dhoraji, Dist. Rajkot, Gujarat - 360410</p>
              <p>Contact: +91 98765 43210</p>
              <p>PAN NO.: AAAA0000A</p>
            </div>
            <div className="w-1/2 p-2.5 flex flex-col">
              <p className="font-bold underline mb-1 text-[12px]">Consignee (Ship to)</p>
              <p className="font-bold text-[15px] uppercase">{shipment.dest_name}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{selectedShipTo}</p>
              <div className="mt-2 text-[13px]">
                {shipment.gst_no && <p><span className="font-bold">GST NO:</span> {shipment.gst_no}</p>}
                {shipment.dest_mobile && <p><span className="font-bold">Mobile no:</span> {shipment.dest_mobile}</p>}
              </div>
            </div>
          </div>
          <div className="border-b-2 border-black">
              <div className="grid grid-cols-[180px_1fr]">
                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">DC / Invoice No.</div>
                  <div className="border-b border-black p-2.5 pl-3 font-bold text-[14px]">{invoiceNo}</div>

                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">Date</div>
                  <div className="border-b border-black p-2.5 pl-3 font-bold text-[14px]">{shipment.dispatch_date ? new Date(shipment.dispatch_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</div>
                  
                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">Dispatch From</div>
                  <div className="border-b border-black p-2.5 pl-3 text-[14px]">{dispatchFrom}</div>
                  
                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">Organizer</div>
                  <div className="border-b border-black p-2.5 pl-3 font-bold uppercase text-[14px]">Rudra Seeds & Organiser</div>
                  
                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">Transport Name</div>
                  <div className="border-b border-black p-2.5 pl-3 uppercase font-bold text-[14px]">{shipment.transport_name}</div>
                  
                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">Mode of Dispatch</div>
                  <div className="border-b border-black p-2.5 pl-3 text-[14px]">Truck No.: {shipment.vehicle_number}</div>
                  
                  <div className="border-b border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">Destination</div>
                  <div className="border-b border-black p-2.5 pl-3 text-[14px]">{destinationCity}</div>
                  
                  <div className="border-r border-black p-2.5 font-bold bg-gray-50 print:bg-transparent pl-3 text-[13px]">No of Bags/Boxes</div>
                  <div className="p-2.5 pl-3 font-bold text-[14px]">{totalBags} Nos.</div>
              </div>
          </div>
          
          <div className="flex flex-col">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100 print:bg-transparent">
                  <th className="border-r border-black p-2 font-bold w-[5%] text-center">Sr.<br/>No.</th>
                  <th className="border-r border-black p-2 font-bold w-[18%] text-left">Farmer Name</th>
                  <th className="border-r border-black p-2 font-bold w-[18%] text-left">Item Name</th>
                  <th className="border-r border-black p-2 font-bold w-[13%] text-center">Lot No.</th>
                  <th className="border-r border-black p-2 font-bold w-[8%] text-center">Bags<br/><span className="font-normal text-[10px]">({packSize} Kg)</span></th>
                  <th className="border-r border-black p-2 font-bold w-[10%] text-center">Qty (Kg)</th>
                  <th className="border-r border-black p-2 font-bold w-[10%] text-center">Rate</th>
                  <th className="p-2 font-bold w-[18%] text-right pr-2">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="align-top border-b border-black last:border-b-0">
                    <td className="border-r border-black p-2 text-center">{index + 1}</td>
                    <td className="border-r border-black p-2 text-left font-bold">{item.farmer_name}</td>
                    <td className="border-r border-black p-2 font-bold">SW-{item.variety_name}</td>
                    <td className="border-r border-black p-2 text-center font-mono text-[11px] font-semibold">{item.lot_no}</td>
                    <td className="border-r border-black p-2 text-center font-semibold">{item.bags}</td>
                    <td className="border-r border-black p-2 text-center font-bold">{(Number(item.bags) * packSize).toFixed(2)}</td>
                    <td className="border-r border-black p-0 text-center">
                        <input type="number" value={rates[index]} onChange={(e) => handleRateChange(index, Number(e.target.value))} className="w-full h-full text-center bg-yellow-50 outline-none print:appearance-none text-[13px] py-2 font-bold print:bg-transparent" step="0.01" />
                    </td>
                    <td className="p-2 text-right font-bold pr-2">{(Number(item.bags) * packSize * rates[index]).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex border-t-2 border-b-2 border-black bg-gray-100 print:bg-transparent font-bold items-center min-h-[10mm] text-[14px]">
             <div className="w-[54%] border-r border-black p-2 text-right uppercase tracking-wider">Total</div>
             <div className="w-[8%] border-r border-black p-2 text-center">{totalBags}</div>
             <div className="w-[10%] border-r border-black p-2 text-center">{totalQty.toFixed(2)} KG.</div>
             <div className="w-[10%] border-r border-black p-2 text-center"></div>
             <div className="w-[18%] p-2 text-right pr-2">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="flex min-h-[45mm]">
            <div className="w-1/2 border-r-2 border-black p-2.5 flex flex-col justify-between text-[11px] leading-relaxed">
              <p>
                <span className="font-bold underline text-[12px]">Declaration:</span><br/>
                We declare that this delivery challan shows the actual price of the goods described and that all particulars are true and correct. Tax free seeds. Hence, no e-way bill is required to be generated as the goods covered under this delivery challan are exempt from tax as per Rule 138 (14), under notification No. 7/2017 Central Tax (Rate) dated 28 June 2017.
              </p>
              <div className="mt-6 flex flex-col items-center w-[60%]">
                  <span className="font-bold text-[14px] mb-8">Receiver's Signature</span>
                  <span className="text-[10px] font-normal border-t border-gray-400 w-full text-center pt-1">(Receive in Good Condition)</span>
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="p-3 flex flex-col justify-between items-end flex-grow">
                 <p className="font-bold text-[13px]">for Rudra Seeds & Organiser</p>
                 <p className="font-bold text-[13px] mt-auto">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}