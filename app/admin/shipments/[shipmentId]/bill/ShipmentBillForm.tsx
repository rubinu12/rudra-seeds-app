// app/admin/shipments/[shipmentId]/bill/ShipmentBillForm.tsx
"use client";

import React, { useState, useEffect, useMemo, useActionState, useTransition } from 'react';
import { ShipmentBillData, ShipmentBillItem } from '@/lib/shipment-data'; // Use the new path
import { Input, Textarea } from '@/components/ui/FormInputs';
import { saveShipmentBillAction, SaveBillFormState } from '@/app/admin/shipments/actions'; // Use the new path
import { Printer, Save, LoaderCircle, IndianRupee, Scale, Package, CalendarDays, Truck, Phone, User } from 'lucide-react';
import Image from 'next/image'; // For logo

type ShipmentBillFormProps = {
    initialBillData: ShipmentBillData;
};

// Type for the state holding edited prices { item_id: price_per_kg }
type ItemPricesState = {
    [itemId: number]: string; // Store price as string for input control
};

// Type for other editable fields on the bill
type BillEditsState = {
    originVillage: string; // From description
    seedVarietyDisplay: string; // Editable display of seed variety
    driverLicenseNo: string;
    vehicleFare: string;
};

const initialSaveState: SaveBillFormState = { message: '', success: false };

// Hardcoded Company Info
const COMPANY_INFO = {
    GST: "24DNTPG8564E1ZL",
    NAME: "RUDRA SEED & ORGANISER",
    ADDRESS_LINE1: "Shop No. 16, Nr. Sardar Chok, Jetpur Road,",
    ADDRESS_LINE2: "Dhoraji - 360 410",
    CONTACT_PERSON: "Denish Patel",
    MOBILE: "Mo: 8154000459",
    EMAIL: "E-mail: denishghauva555@gmail.com",
    BILL_CONTACT_MOBILE: "8154000459", // Mobile shown in image_e1cca0
    HSN_CODE: "1207" // Example, adjust as needed
};

export default function ShipmentBillForm({ initialBillData }: ShipmentBillFormProps) {
    // State for editable prices (per kg)
    const [itemPrices, setItemPrices] = useState<ItemPricesState>({});
    // State for other editable fields
    const [billEdits, setBillEdits] = useState<BillEditsState>({
        originVillage: 'Dhoraji', // Default or fetch if possible
        seedVarietyDisplay: initialBillData.items[0]?.seed_variety || '', // Use first item's variety initially
        driverLicenseNo: '',
        vehicleFare: '',
    });
    const [isPrintMode, setIsPrintMode] = useState(false);

    const [saveState, formAction] = useActionState(saveShipmentBillAction, initialSaveState);
    const [isSavePending, startSaveTransition] = useTransition();

    // Initialize editable prices when data loads
    useEffect(() => {
        const initialPrices: ItemPricesState = {};
        initialBillData.items.forEach(item => {
            initialPrices[item.item_id] = (item.initial_price_per_kg ?? 0).toFixed(2); // Initialize with calculated price/kg
        });
        setItemPrices(initialPrices);
        // Optionally set initial seed variety display if needed
        setBillEdits(prev => ({
            ...prev,
             seedVarietyDisplay: initialBillData.items[0]?.seed_variety || '',
             // You could try fetching the village name associated with the first item's crop cycle here if needed
        }));
    }, [initialBillData]);

    // Handle price input changes
    const handlePriceChange = (itemId: number, value: string) => {
        // Allow numbers and one decimal point
        const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        setItemPrices(prev => ({ ...prev, [itemId]: sanitizedValue }));
    };

    // Handle other editable field changes
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBillEdits(prev => ({ ...prev, [name]: value }));
    };

    // Calculate item totals and grand totals
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
                current_price_per_kg: pricePerKg, // Store current price used
                item_total_amount: itemTotal,   // Store calculated total
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

    const handlePrint = () => {
        setIsPrintMode(true); // Hide buttons via state
        setTimeout(() => { // Allow state to update and UI to re-render
            window.print();
            setIsPrintMode(false); // Show buttons again after print dialog
        }, 100); // Small delay
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append('shipmentId', String(initialBillData.shipment_id));
        formData.append('totalAmount', String(totals.amount.toFixed(2))); // Send calculated total

        // Include other edited fields if they need to be saved to the DB
        // formData.append('driverLicenseNo', billEdits.driverLicenseNo);
        // formData.append('vehicleFare', billEdits.vehicleFare);

        startSaveTransition(() => {
            formAction(formData);
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            // Format as DD-MM-YYYY
            return new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-GB'); // Use UTC interpretation
        } catch { return "Invalid Date"; }
    };

    return (
        <div className="shipment-bill-container p-4 max-w-4xl mx-auto bg-white">
            {/* --- Header --- */}
            <div className="bill-header text-center mb-4 border-b pb-2">
                <p className="text-xs font-semibold">GST NO: {COMPANY_INFO.GST}</p>
                 {/* Optional: Add Logo */}
                 {/* <Image src="/Rudra-Seeds-Logo.svg" alt="Rudra Seeds Logo" width={80} height={40} className="mx-auto my-1"/> */}
                <h1 className="text-xl font-bold">{COMPANY_INFO.NAME}</h1>
                <p className="text-sm">{COMPANY_INFO.ADDRESS_LINE1}</p>
                <p className="text-sm">{COMPANY_INFO.ADDRESS_LINE2}</p>
                <p className="text-sm">{COMPANY_INFO.CONTACT_PERSON} - {COMPANY_INFO.MOBILE}</p>
                <p className="text-sm">{COMPANY_INFO.EMAIL}</p>
            </div>

            {/* --- Delivery Info --- */}
            <div className="mb-4 text-sm">
                <strong>Delivery To:</strong> {initialBillData.destination_company_name || 'N/A'}
            </div>

            {/* --- Shipment Details / Description --- */}
            <div className="shipment-details border p-2 mb-4 text-sm space-y-1">
                <div className="flex justify-between">
                    <span><strong>Date:</strong> {formatDate(initialBillData.dispatch_date)}</span>
                    <span><strong>Mobile No:</strong> {COMPANY_INFO.BILL_CONTACT_MOBILE}</span>
                </div>
                {/* Editable Description Line */}
                <div className="flex items-center gap-1 flex-wrap">
                    <span>Today, from village</span>
                    <Input
                        id="originVillage" name="originVillage" label="" // No label needed here
                        value={billEdits.originVillage} onChange={handleEditChange}
                        className="inline-block !w-auto !min-w-[100px] !border-b !border-gray-400 !rounded-none !bg-transparent !p-0 !h-auto"
                        disabled={isSavePending}
                     />
                     <span>seed variety</span>
                     <Input
                        id="seedVarietyDisplay" name="seedVarietyDisplay" label=""
                        value={billEdits.seedVarietyDisplay} onChange={handleEditChange}
                         className="inline-block !w-auto !min-w-[150px] !border-b !border-gray-400 !rounded-none !bg-transparent !p-0 !h-auto"
                        disabled={isSavePending}
                     />
                    {/* Add other editable parts here if needed */}
                    <span>Total Bags: <strong>{totals.bags}</strong> Total Weight (Kg): <strong>{totals.weight.toFixed(0)}</strong></span>
                 </div>
                 <p className='text-xs'>[Standard Gujarati text translated/adapted to English as needed]</p>
            </div>

            {/* --- Itemized Table --- */}
            <div className="bill-table overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-1">S.No</th>
                            <th className="border border-gray-300 p-1">Farmer Name</th>
                            <th className="border border-gray-300 p-1">Lot No</th>
                            <th className="border border-gray-300 p-1 text-right">Bags</th>
                            <th className="border border-gray-300 p-1 text-right">Weight (Kg)</th>
                            <th className="border border-gray-300 p-1 text-right w-28">Price (₹/Kg)</th>
                            <th className="border border-gray-300 p-1 text-right">Total Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculatedItems.map((item, index) => (
                            <tr key={item.item_id}>
                                <td className="border border-gray-300 p-1 text-center">{index + 1}</td>
                                <td className="border border-gray-300 p-1">{item.farmer_name}</td>
                                <td className="border border-gray-300 p-1 text-center">{item.lot_no || '-'}</td>
                                <td className="border border-gray-300 p-1 text-right">{item.bags_loaded}</td>
                                <td className="border border-gray-300 p-1 text-right">{item.weight_kg?.toFixed(0)}</td>
                                <td className="border border-gray-300 p-0"> {/* No padding on cell */}
                                    <Input
                                        type="number"
                                        id={`price_${item.item_id}`} name={`price_${item.item_id}`} label="" // No label needed
                                        value={itemPrices[item.item_id] ?? ''}
                                        onChange={(e) => handlePriceChange(item.item_id, e.target.value)}
                                        step="0.01" min="0" disabled={isSavePending} required
                                        // Simplified input styling for table
                                        className="!w-full !h-full !text-right !px-1 !py-1 !border-0 !rounded-none !bg-transparent focus:!ring-1 focus:!ring-primary"
                                    />
                                </td>
                                <td className="border border-gray-300 p-1 text-right">{item.item_total_amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-gray-100">
                            <td colSpan={3} className="border border-gray-300 p-1 text-right">Total</td>
                            <td className="border border-gray-300 p-1 text-right">{totals.bags}</td>
                            <td className="border border-gray-300 p-1 text-right">{totals.weight.toFixed(0)}</td>
                            <td className="border border-gray-300 p-1"></td>
                            <td className="border border-gray-300 p-1 text-right">{totals.amount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

             {/* --- HSN Code --- */}
             <p className="text-sm mb-4"><strong>HSN Code:</strong> {COMPANY_INFO.HSN_CODE}</p>

            {/* --- Footer Details --- */}
            <div className="bill-footer grid grid-cols-2 gap-x-8 gap-y-2 border p-2 text-sm mb-4">
                <span><strong>Total Weight (Kg):</strong> {totals.weight.toFixed(0)}</span>
                <span><strong>Total Bags:</strong> {totals.bags}</span>
                <span><strong>Vehicle No:</strong> {initialBillData.vehicle_number || 'N/A'}</span>
                <span><strong>Driver Lic. No:</strong> <Input id="driverLicenseNo" name="driverLicenseNo" label="" value={billEdits.driverLicenseNo} onChange={handleEditChange} className="inline-input" disabled={isSavePending}/></span>
                <span><strong>Vehicle Fare (₹):</strong> <Input type="number" step="0.01" id="vehicleFare" name="vehicleFare" label="" value={billEdits.vehicleFare} onChange={handleEditChange} className="inline-input" disabled={isSavePending}/></span>
                <span><strong>Driver Mobile:</strong> {initialBillData.driver_mobile || 'N/A'}</span>
                <span className="mt-4"><strong>Sender Signature:</strong> _______________</span>
                <span className="mt-4"><strong>Receiver Signature:</strong> _______________</span>
            </div>

            {/* --- Action Buttons & Feedback --- */}
            {!isPrintMode && ( // Hide buttons in print mode
                <div className="bill-actions mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={handleSave} className="btn bg-primary text-on-primary px-6 py-2 rounded-full flex items-center justify-center gap-2 disabled:opacity-50" disabled={isSavePending}>
                        {isSavePending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSavePending ? 'Saving...' : 'Save Bill Amount'}
                    </button>
                    <button onClick={handlePrint} className="btn border border-outline text-primary px-6 py-2 rounded-full flex items-center justify-center gap-2">
                        <Printer className="w-5 h-5" /> Print Bill
                    </button>
                </div>
            )}
            {saveState?.message && (
                <p className={`mt-3 text-center text-sm font-medium ${saveState.success ? 'text-green-600' : 'text-error'}`}>
                    {saveState.message}
                </p>
            )}

            {/* --- Print Styles --- */}
            <style jsx global>{`
                .inline-input input {
                    display: inline-block !important;
                    width: auto !important;
                    min-width: 100px !important;
                    border-bottom: 1px solid #ccc !important;
                    border-radius: 0 !important;
                    background: transparent !important;
                    padding: 0 !important;
                    height: auto !important;
                }
                .inline-input label { display: none !important; } /* Hide floating label for inline */
                .inline-input { border: none !important; padding: 0 !important; background: transparent !important; }

                @media print {
                    body * { visibility: hidden; }
                    .shipment-bill-container, .shipment-bill-container * { visibility: visible; }
                    .shipment-bill-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10mm; border: none; font-size: 10pt; }
                    .bill-header, .shipment-details, .bill-table, .bill-footer { border-color: #000 !important; }
                    .bill-table th, .bill-table td { border-color: #666 !important; padding: 2px 4px;}
                    .bill-table input { border: none !important; font-size: inherit !important; padding: 1px !important; text-align: right; width: 100% !important; box-shadow: none !important; outline: none !important; }
                    .bill-actions { display: none !important; }
                    .inline-input input { border-bottom: none !important; }
                    /* Ensure backgrounds are not printed unless necessary */
                    table thead tr, table tfoot tr { background-color: #f2f2f2 !important; print-color-adjust: exact; }
                }
                @page { size: A4; margin: 10mm; }
            `}</style>
        </div>
    );
}