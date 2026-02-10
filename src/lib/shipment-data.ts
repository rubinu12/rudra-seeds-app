// lib/shipment-data.ts
"use server";

import { sql } from '@vercel/postgres';
// Import any necessary types from definitions if needed later
// import type { ... } from './definitions';

// --- Type Definitions for Shipment Bill ---

export type ShipmentBillItem = {
    // From shipment_items
    item_id: number;
    bags_loaded: number;
    // From crop_cycles
    crop_cycle_id: number;
    lot_no: string | null;
    purchase_rate: number | null; // Price per 20kg (Man)
    // From farmers
    farmer_name: string;
    // From seeds
    seed_variety: string;
    // Calculated
    weight_kg?: number; // Calculated (bags * 50)
    initial_price_per_kg?: number; // Calculated (purchase_rate / 20)
};

export type ShipmentBillData = {
    // From shipments
    shipment_id: number;
    vehicle_number: string | null;
    driver_name: string | null;
    driver_mobile: string | null;
    dispatch_date: string | null; // Formatted date string
    status: string;
    // From destination_companies
    destination_company_name: string | null;
    // Aggregated Items
    items: ShipmentBillItem[];
};

export type DispatchedShipmentInfo = {
    shipment_id: number;
    vehicle_number: string | null;
    destination_company_name: string | null;
    dispatch_date: string | null; // Formatted date string
    total_bags: number | null;
    // Add company_payment if needed to show if already billed
    // company_payment: number | null;
};

// --- Data Fetching Function for Shipment Bill ---

export async function getShipmentBillDetails(shipmentId: number): Promise<ShipmentBillData | null> {
    if (isNaN(shipmentId) || shipmentId <= 0) {
        console.error("Invalid shipmentId provided:", shipmentId);
        return null;
    }

    try {
        // Fetch shipment and destination company info
        const shipmentResult = await sql`
            SELECT
                s.shipment_id,
                s.vehicle_number,
                s.driver_name,
                s.driver_mobile,
                TO_CHAR(s.dispatch_date, 'YYYY-MM-DD') as dispatch_date, -- Format date
                s.status,
                dc.company_name as destination_company_name
            FROM shipments s
            LEFT JOIN destination_companies dc ON s.dest_company_id = dc.dest_company_id
            WHERE s.shipment_id = ${shipmentId};
        `;

        if (shipmentResult.rowCount === 0) {
            console.warn(`Shipment Bill: Shipment ID ${shipmentId} not found.`);
            return null; // Shipment not found
        }

        const shipmentData = shipmentResult.rows[0];

        // Fetch items associated with the shipment and their related details
        const itemsResult = await sql<Omit<ShipmentBillItem, 'weight_kg' | 'initial_price_per_kg'>>`
            SELECT
                si.item_id,
                si.bags_loaded,
                cc.crop_cycle_id,
                cc.lot_no,
                cc.purchase_rate, -- This is price per 20kg
                f.name as farmer_name,
                s.variety_name as seed_variety
            FROM shipment_items si
            JOIN crop_cycles cc ON si.crop_cycle_id = cc.crop_cycle_id
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE si.shipment_id = ${shipmentId}
            ORDER BY f.name, cc.lot_no; -- Or desired order
        `;

        // Calculate weight and initial price per kg for each item
        const processedItems: ShipmentBillItem[] = itemsResult.rows.map(item => ({
            ...item,
            item_id: Number(item.item_id),
            bags_loaded: Number(item.bags_loaded),
            crop_cycle_id: Number(item.crop_cycle_id),
            purchase_rate: item.purchase_rate !== null ? Number(item.purchase_rate) : null,
            weight_kg: Number(item.bags_loaded) * 50,
            initial_price_per_kg: item.purchase_rate !== null ? Number(item.purchase_rate) / 20 : 0, // Calculate price per kg
        }));

        console.log(`Shipment Bill: Fetched ${processedItems.length} items for shipment ${shipmentId}.`);

        return {
            shipment_id: Number(shipmentData.shipment_id),
            vehicle_number: shipmentData.vehicle_number as string | null,
            driver_name: shipmentData.driver_name as string | null,
            driver_mobile: shipmentData.driver_mobile as string | null,
            dispatch_date: shipmentData.dispatch_date as string | null,
            status: shipmentData.status as string,
            destination_company_name: shipmentData.destination_company_name as string | null,
            items: processedItems,
        };

    } catch (error) {
        console.error(`Database Error fetching bill details for shipment ${shipmentId}:`, error);
        throw new Error('Failed to fetch shipment bill details.');
    }
}


export async function getDispatchedShipmentsForBilling(): Promise<DispatchedShipmentInfo[]> {
    console.log("[Data Fetch] Getting dispatched shipments for billing...");
    try {
        // Fetch shipments with status 'Dispatched'
        // Join with destination_companies to get the name
        // Order by dispatch date, newest first
        const result = await sql<DispatchedShipmentInfo>`
            SELECT
                s.shipment_id,
                s.vehicle_number,
                dc.company_name as destination_company_name,
                TO_CHAR(s.dispatch_date, 'DD-Mon-YYYY') as dispatch_date, -- Format date nicely
                s.total_bags
                -- s.company_payment -- Include if needed
            FROM shipments s
            LEFT JOIN destination_companies dc ON s.dest_company_id = dc.dest_company_id
            WHERE s.status = 'Dispatched'
            ORDER BY s.dispatch_date DESC NULLS LAST;
        `;

        console.log(`[Data Fetch] Found ${result.rowCount} dispatched shipments.`);

        // Ensure numbers are numbers
        const shipments = result.rows.map(s => ({
            ...s,
            shipment_id: Number(s.shipment_id),
            total_bags: s.total_bags !== null ? Number(s.total_bags) : null,
            // company_payment: s.company_payment !== null ? Number(s.company_payment) : null,
        }));

        return shipments;

    } catch (error) {
        console.error(`Database Error fetching dispatched shipments:`, error);
        throw new Error('Failed to fetch dispatched shipments.');
    }
}
// Add other shipment-related data functions here later if needed