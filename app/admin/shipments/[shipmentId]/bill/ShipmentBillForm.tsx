// app/admin/shipments/[shipmentId]/bill/ShipmentBillForm.tsx
"use client";

// 1. Import 'memo' from react
import React, { useState, useEffect, useMemo, useTransition, memo } from 'react';
import { ShipmentBillData, ShipmentBillItem } from '@/lib/shipment-data';
import { saveShipmentBillAction, SaveBillFormState } from '@/app/admin/shipments/actions';
import { Printer, Save, LoaderCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image'; // Optional for logo

type ShipmentBillFormProps = {
    initialBillData: ShipmentBillData;
};

// Type for the state holding edited prices { item_id: price_per_kg }
type ItemPricesState = {
    [itemId: number]: string; // Store price as string for input control
};

// Type for other editable fields on the bill
type BillEditsState = {
    originVillage: string;
    destinationCity: string;
    driverLicenseNo: string;
    vehicleFare: string;
    seedVarietyDisplay: string; // <-- ADDED
};

// Hardcoded Company Info
const COMPANY_INFO = {
    GST: "24DNTPG8564E1ZL",
    NAME: "** RUDRA SEED & ORGANISER **",
    ADDRESS_LINE1: "Shop No. 16, Nr. Sardar Chok, Jetpur Road,",
    ADDRESS_LINE2: "Dhoraji - 360 410",
    MOBILE: "Mo: 8154000459",
    BILL_CONTACT_MOBILE: "8154000459",
    HSN_CODE: "1207"
};

// ---
// *** 2. FIX: HELPER COMPONENTS MOVED OUTSIDE & WRAPPED IN React.memo ***
// ---

// Helper component for editable fields
const EditableField = memo(({ label, name, value, onChange, disabled, isNumeric = false, wide = false }: any) => (
    <div className={`flex items-baseline gap-1 ${wide ? 'col-span-2' : ''}`}>
        <span className="font-semibold w-28 inline-block print:w-auto">{label}:</span>
        {/* Input field for screen view - has print:hidden */}
        <input
            type={isNumeric ? "number" : "text"}
            step={isNumeric ? "0.01" : undefined}
            name={name}
            value={value}
            onChange={onChange} // This receives the full event
            className={`inline-input flex-grow print:hidden ${disabled ? 'opacity-50' : ''}`}
            disabled={disabled}
            placeholder={isNumeric ? "0.00" : "..."}
        />
        {/* Clean text for print view - has hidden print:inline */}
        <span className="hidden print:inline">{value || (isNumeric ? "0.00" : "N/A")}</span>
    </div>
));

// Helper component for table price input
const PriceInput = memo(({ itemId, value, onChange, disabled }: any) => (
    <>
       <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => onChange(itemId, e.target.value)} // This passes the value
            disabled={disabled}
            className="w-full text-right px-1 py-0.5 border border-gray-300 rounded print:hidden"
        />
        {/* This span will be shown *instead* of the input when printing */}
        <span className="hidden print:inline print:font-normal">
            {(parseFloat(value || '0')).toFixed(2)}
        </span>
    </>
));

// Add display name for better debugging
EditableField.displayName = 'EditableField';
PriceInput.displayName = 'PriceInput';

// --- 
// *** END OF HELPER COMPONENTS ***
// ---


export default function ShipmentBillForm({ initialBillData }: ShipmentBillFormProps) {
    
    // State for all manually entered fields
    const [billEdits, setBillEdits] = useState<BillEditsState>({
        originVillage: 'Dhoraji',
        destinationCity: 'Himatnagar',
        driverLicenseNo: '',
        vehicleFare: '',
        seedVarietyDisplay: '', // <-- ADDED
    });
    
    const [itemPrices, setItemPrices] = useState<ItemPricesState>({});
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [saveResult, setSaveResult] = useState<SaveBillFormState | null>(null);

    useEffect(() => {
        const initialPrices: ItemPricesState = {};
        initialBillData.items.forEach(item => {
            initialPrices[item.item_id] = (item.initial_price_per_kg ?? 0).toFixed(2);
        });
        setItemPrices(initialPrices);
        
        // Consolidate seed varieties from fetched data
        const varieties = [...new Set(initialBillData.items.map(item => item.seed_variety))];
        const varietyString = varieties.join(', ') || 'N/A';

        // Set all manual fields to their defaults
        setBillEdits({
             originVillage: 'Dhoraji',
             destinationCity: 'Himatnagar',
             driverLicenseNo: '',
             vehicleFare: '',
             seedVarietyDisplay: varietyString, // <-- SET variety here
        });
    }, [initialBillData]);

    // This single handler now works for all text/number inputs
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'vehicleFare') {
            const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            setBillEdits(prev => ({ ...prev, [name]: sanitizedValue }));
        } else {
            setBillEdits(prev => ({ ...prev, [name]: value }));
        }
    };

    // This handler works for the item price inputs
    const handlePriceChange = (itemId: number, value: string) => {
        const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        setItemPrices(prev => ({ ...prev, [itemId]: sanitizedValue }));
    };

    // Calculate item totals and grand totals based on *current state*
    const { calculatedItems, totals } = useMemo(() => {
        let totalBags = 0;
        let totalWeight = 0;
        let totalAmount = 0;

        const itemsWithTotals = initialBillData.items.map(item => {
            const pricePerKg = parseFloat(itemPrices[item.item_id] || '0');
            const weightKg = item.weight_kg || 0;
            const itemTotal = weightKg * pricePerKg;

            totalBags += item.bags_loaded;
            totalWeight += weightKg;
            totalAmount += itemTotal;

            return {
                ...item,
                current_price_per_kg: pricePerKg,
                item_total_amount: itemTotal,
            };
        });

        return {
            calculatedItems: itemsWithTotals,
            totals: {
                bags: totalBags,
                weight: totalWeight,
                amount: totalAmount,
            }
        };
    }, [initialBillData.items, itemPrices]);

    // Format date as DD-MM-YYYY
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            const datePart = dateString.split('T')[0];
            const [year, month, day] = datePart.split('-');
            if (!year || !month || !day) return 'Invalid Date';
            return `${day}-${month}-${year}`;
        } catch { return "Invalid Date"; }
    };

    const dispatchDateFormatted = formatDate(initialBillData.dispatch_date);
    
    // "Save and Print" function
    const handleSaveAndPrint = () => {
        setSaveResult(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append('shipmentId', String(initialBillData.shipment_id));
            formData.append('totalAmount', String(totals.amount.toFixed(2)));
            
            const result = await saveShipmentBillAction(undefined, formData);
            setSaveResult(result);

            if (result.success) {
                setIsPrinting(true);
                await new Promise(resolve => setTimeout(resolve, 50)); 
                window.print();
                setIsPrinting(false);
            }
        });
    };

    return (
        <div className="shipment-bill-container p-4 max-w-4xl mx-auto bg-white font-sans text-black">
             {/* --- Action Buttons & Feedback (Screen View Only) --- */}
            <div className={`bill-actions mb-6 flex flex-col sm:flex-row justify-center gap-4 print:hidden ${isPrinting ? 'invisible' : ''}`}>
                <button onClick={() => window.history.back()} className="btn border border-outline text-gray-700 px-6 py-2 rounded-full flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={handleSaveAndPrint} className="btn bg-green-600 text-white px-6 py-2 rounded-full flex items-center justify-center gap-2" disabled={isPending}>
                    {isPending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                    {isPending ? 'Saving...' : 'Save and Print'}
                </button>
            </div>
            {saveResult && !saveResult.success && (
                <p className={`mb-4 text-center text-sm font-medium text-error print:hidden ${isPrinting ? 'invisible' : ''}`}>
                    Error: {saveResult.message || "Failed to save."}
                </p>
            )}

            {/* --- Bill Content for Print --- */}
            <div className="bill-print-area border border-black p-4">

                {/* Header Section */}
                <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                    <p className="text-xs font-semibold">GST No: {COMPANY_INFO.GST}</p>
                    <h1 className="text-xl font-bold mt-1">{COMPANY_INFO.NAME.replace(/\*/g, '')}</h1>
                    <p className="text-xs">{COMPANY_INFO.ADDRESS_LINE1} {COMPANY_INFO.ADDRESS_LINE2}</p>
                    <p className="text-xs">Denish Patel: {COMPANY_INFO.MOBILE}</p>
                    <h2 className="text-md font-semibold mt-2 underline">DISPATCH NOTE</h2>
                </div>

                {/* Delivery To / Date / From Section */}
                <div className="flex justify-between mb-1 text-xs">
                    <div>
                        <span className="font-semibold">To:</span> {initialBillData.destination_company_name || 'N/A'}, At 
                        <input type="text" name="destinationCity" value={billEdits.destinationCity} onChange={handleEditChange} className="inline-input w-40 print:hidden" disabled={isPending} />
                        <span className="hidden print:inline">{billEdits.destinationCity}</span>
                    </div>
                    <div className="font-bold text-lg">⑥</div>
                </div>
                 <hr className="border-dashed border-black my-2" />
                 <div className="flex justify-between mb-2 text-xs">
                     <p><span className="font-semibold">Date:</span> {dispatchDateFormatted}</p>
                     <p><span className="font-semibold">From:</span> 
                        <input type="text" name="originVillage" value={billEdits.originVillage} onChange={handleEditChange} className="inline-input w-40 print:hidden" disabled={isPending} />
                        <span className="hidden print:inline">{billEdits.originVillage}</span>
                    </p>
                 </div>
                 <hr className="border-dashed border-black my-2" />

                {/* Subject and Dynamic Paragraph */}
                <div className="mb-4 text-sm leading-relaxed space-y-2">
                    <p><span className="font-semibold w-16 inline-block">Subject:</span> Dispatch of Certified Seed Bags</p>
                    
                    {/* *** 3. NEW EDITABLE VARIETY LINE *** */}
                    <div className="flex items-baseline">
                         <span className="font-semibold w-16 inline-block">Variety:</span>
                         <input 
                             type="text" 
                             name="seedVarietyDisplay" 
                             value={billEdits.seedVarietyDisplay} 
                             onChange={handleEditChange} 
                             className="inline-input flex-grow print:hidden" 
                             disabled={isPending} 
                         />
                         <span className="hidden print:inline font-semibold">{billEdits.seedVarietyDisplay}</span>
                    </div>
                </div>

                {/* Main Body Paragraph */}
                <div className="mb-4 text-sm leading-relaxed space-y-2">
                    <p>
                        Total bags: <span className="font-semibold">{totals.bags}</span> certified seed bags of <span className="font-semibold">{billEdits.seedVarietyDisplay}</span> have been dispatched today <span className="font-semibold">{dispatchDateFormatted}</span> from <span className="font-semibold">{billEdits.originVillage}</span> to your company, {initialBillData.destination_company_name || 'N/A'}, at <span className="font-semibold">{billEdits.destinationCity}</span>.
                    </p>
                    <p>This dispatch is carried out in accordance with the rules and standards of the Gujarat State Seed Certification Agency.</p>
                    <p>Please accept delivery and handle it with care.</p>
                    <p className="font-semibold">The list of sub-seed producers is as follows:</p>
                </div>
                 
                {/* Itemized Table */}
                <div className="bill-table overflow-x-auto mb-2">
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="font-semibold bg-gray-100">
                                <th className="border border-black p-1 w-[5%]">Sr.No</th>
                                <th className="border border-black p-1">Sub Seed Producer Name</th>
                                <th className="border border-black p-1 w-[10%]">Lot No.</th>
                                <th className="border border-black p-1 w-[10%] text-right">Bags</th>
                                <th className="border border-black p-1 w-[15%] text-right">Weight (Kg)</th>
                                <th className="border border-black p-1 w-[10%] text-right">Rate</th>
                                <th className="border border-black p-1 w-[15%] text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedItems.map((item, index) => (
                                <tr key={item.item_id}>
                                    <td className="border border-black p-1 text-center">{index + 1}</td>
                                    <td className="border border-black p-1">{item.farmer_name}</td>
                                    <td className="border border-black p-1 text-center">{item.lot_no || '-'}</td>
                                    <td className="border border-black p-1 text-right">{item.bags_loaded}</td>
                                    <td className="border border-black p-1 text-right">{item.weight_kg?.toFixed(0)}</td>
                                    <td className="border border-black p-1 text-right">
                                        <PriceInput itemId={item.item_id} value={itemPrices[item.item_id] ?? ''} onChange={handlePriceChange} disabled={isPending} />
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {item.item_total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-gray-100">
                                <td colSpan={3} className="border border-black p-1 text-center">Total</td>
                                <td className="border border-black p-1 text-right">{totals.bags}</td>
                                <td className="border border-black p-1 text-right">{totals.weight.toFixed(0)}</td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1 text-right">
                                    {totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <hr className="border-dashed border-black my-2" />

                 {/* Footer Details Grid */}
                 <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2">
                    <p><span className="font-semibold w-28 inline-block">HSN Code</span>: {COMPANY_INFO.HSN_CODE}</p>
                    <p><span className="font-semibold w-28 inline-block">Total Bags</span>: {totals.bags}</p>
                    <p><span className="font-semibold w-28 inline-block">Total Weight (Kg)</span>: {totals.weight.toFixed(0)}</p>
                    <EditableField label="Driver Lic. No" name="driverLicenseNo" value={billEdits.driverLicenseNo} onChange={handleEditChange} disabled={isPending} />
                    <p><span className="font-semibold w-28 inline-block">Vehicle No.</span>: {initialBillData.vehicle_number || 'N/A'}</p>
                    <EditableField label="Vehicle Fare (₹)" name="vehicleFare" value={billEdits.vehicleFare} onChange={handleEditChange} disabled={isPending} isNumeric={true} />
                    <p><span className="font-semibold w-28 inline-block">Driver Name</span>: {initialBillData.driver_name || 'N/A'}</p>
                    <p><span className="font-semibold w-28 inline-block">Driver Mobile</span>: {initialBillData.driver_mobile || 'N/A'}</p>
                </div>
                 <hr className="border-dashed border-black my-2" />

                 {/* Signature Area */}
                <div className="flex justify-between mt-12 pt-4 text-sm signature-area">
                    <span>Sender Signature</span>
                    <span>Receiver Signature</span>
                </div>

            </div> {/* End bill-print-area */}

            {/* --- Print & Inline Input Styles --- */}
            <style jsx global>{`
                .btn { /* Basic button styling */ 
                    display: inline-flex; align-items: center; justify-content: center;
                    gap: 0.5rem; border-radius: 9999px; font-weight: 500;
                    transition: background-color 0.2s; padding: 0.5rem 1.5rem;
                }
                .bill-print-area { font-family: Arial, sans-serif; line-height: 1.5; }
                .bill-table th, .bill-table td { padding: 2px 4px; }

                /* Style for inline inputs on screen */
                 .inline-input {
                    display: inline-block !important;
                    border: none !important;
                    border-bottom: 1px dotted #666 !important;
                    border-radius: 0 !important;
                    background: transparent !important;
                    padding: 0 2px !important;
                    height: auto !important;
                    line-height: inherit !important;
                    font-size: inherit !important;
                    width: auto;
                    min-width: 80px;
                    box-shadow: none !important;
                    outline: none !important;
                }
                .inline-input:focus {
                    border-bottom: 1px solid black !important;
                }
                
                /* This is the key: 
                   Use Tailwind's print: variant to hide/show elements.
                   print:hidden HIDES on print.
                   hidden print:inline SHOWS on print.
                */
                @media print {
                    /* Hide elements marked with print:hidden */
                    .print\:hidden {
                        display: none !important;
                    }
                    
                    /* Show elements marked with hidden print:inline */
                    .print\:inline {
                        display: inline !important;
                    }
                    .print\:font-normal {
                        font-weight: 400 !important;
                    }
                
                    /* 1. Hide EVERYTHING by default */
                    body > * {
                        visibility: hidden;
                    }

                    /* 2. Make ONLY the print container AND its contents visible */
                    .shipment-bill-container,
                    .shipment-bill-container * {
                        visibility: visible;
                    }

                    /* 3. Re-hide elements within the container that are NOT for printing */
                    /* This specifically hides the action buttons */
                    .shipment-bill-container .bill-actions {
                        display: none !important;
                    }
                    
                    /* 4. Reset page layout */
                    body { margin: 0; padding: 0; background: white !important; font-size: 10pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    
                    /* 5. Position the print area to fill the page */
                    .shipment-bill-container {
                        margin: 0 !important; padding: 0 !important; border: none !important; width: 100% !important; max-width: none !important; background: transparent !important;
                        position: static !important;
                    }
                    .bill-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 10mm !important; 
                        border: none !important;
                        box-shadow: none !important;
                        font-size: 10pt;
                        color: black !important;
                        line-height: 1.6;
                    }
                    
                    /* 6. Fix table display for printing */
                    .bill-table table { display: table !important; }
                    .bill-table thead { display: table-header-group !important; }
                    .bill-table tbody { display: table-row-group !important; }
                    .bill-table tfoot { display: table-footer-group !important; }
                    .bill-table tr { display: table-row !important; }
                    .bill-table th, .bill-table td { display: table-cell !important; border-color: black !important; padding: 3px 4px; }
                    
                    table { page-break-inside: auto; border-spacing: 0; border-collapse: collapse; }
                    tr    { page-break-inside: avoid; page-break-after: auto }
                    
                    .signature-area { border-top: 1px solid black; position: absolute; bottom: 15mm; left: 10mm; right: 10mm; padding-top: 5px; display: flex !important; }
                    .bg-gray-100 { background-color: #f3f4f6 !important; print-color-adjust: exact; }
                    hr { border-color: black !important; border-style: dashed !important; border-top-width: 1px !important; display: block !important; }
                    .grid { display: grid !important; }
                    .flex { display: flex !important; }
                    .text-center { text-align: center !important; }
                    .text-right { text-align: right !important; }
                    .justify-between { justify-content: space-between !important; }
                }
                @page { size: A4; margin: 0; }
            `}</style>
        </div> // End shipment-bill-container
    );
}