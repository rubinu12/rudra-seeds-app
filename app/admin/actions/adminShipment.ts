"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export type ShipmentData = {
    shipment_id: number;
    vehicle_number: string;
    total_bags: number;
    capacity_in_tonnes: number;
    location: string;
    company_name: string; 
    company_address: string; // Added for Bill
    transport_name: string;
    driver_name: string;
    driver_mobile: string;
    varieties: string[];
    creation_date: Date;
    dispatch_date?: Date;
    filled_by_name: string;
    status: string;
};

export type BillItem = {
    farmer_name: string;
    village_name: string;
    lot_no: string;
    bags: number;
    weight: number; // calculated as bags * 50 (or similar)
};

// --- 1. GET PENDING (FILLED) SHIPMENTS ---
export async function getFilledShipments(): Promise<ShipmentData[]> {
    try {
        const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.total_bags, s.capacity_in_tonnes, s.location, 
                s.driver_name, s.driver_mobile, s.creation_date, s.status,
                dc.company_name, dc.address as company_address,
                tc.company_name as transport_name, u.name as filled_by_name,
                ARRAY(SELECT DISTINCT se.variety_name FROM seeds se WHERE se.seed_id = ANY(s.allowed_seed_ids)) as varieties
            FROM shipments s
            LEFT JOIN destination_companies dc ON s.dest_company_id = dc.dest_company_id
            LEFT JOIN shipment_companies tc ON s.shipment_company_id = tc.company_id
            LEFT JOIN users u ON s.dispatch_by = u.user_id
            WHERE s.status = 'Filled'
            ORDER BY s.confirmation_date ASC
        `;
        return res.rows as ShipmentData[];
    } catch (e) { return []; }
}

// --- 2. GET HISTORY (DISPATCHED) SHIPMENTS ---
export async function getDispatchedShipments(): Promise<ShipmentData[]> {
    try {
        const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.total_bags, s.capacity_in_tonnes, s.location, 
                s.driver_name, s.driver_mobile, s.creation_date, s.dispatch_date, s.status,
                dc.company_name, dc.address as company_address,
                tc.company_name as transport_name, u.name as filled_by_name,
                ARRAY(SELECT DISTINCT se.variety_name FROM seeds se WHERE se.seed_id = ANY(s.allowed_seed_ids)) as varieties
            FROM shipments s
            LEFT JOIN destination_companies dc ON s.dest_company_id = dc.dest_company_id
            LEFT JOIN shipment_companies tc ON s.shipment_company_id = tc.company_id
            LEFT JOIN users u ON s.dispatch_by = u.user_id
            WHERE s.status = 'Dispatched' -- CHANGED from 'Confirmed'
            ORDER BY s.dispatch_date DESC
            LIMIT 50
        `;
        return res.rows as ShipmentData[];
    } catch (e) { return []; }
}

// --- 3. CONFIRM DISPATCH (Sets to 'Dispatched') ---
export async function confirmShipmentDispatch(shipmentId: number) {
    const session = await auth();
    if (session?.user?.role !== 'admin') return { success: false, message: "Unauthorized" };

    try {
        await sql`
            UPDATE shipments 
            SET status = 'Dispatched', dispatch_date = NOW() 
            WHERE shipment_id = ${shipmentId}
        `;
        revalidatePath('/admin-v2/shipments');
        return { success: true, message: "Shipment Dispatched" };
    } catch (e) { return { success: false, message: "Failed to confirm" }; }
}

export async function getShipmentBillData(shipmentId: number) {
    try {
        // 1. Get Shipment Details
        const shipmentRes = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.total_bags, s.driver_name, s.driver_mobile, s.dispatch_date, s.location,
                dc.company_name as dest_name, dc.address as dest_address, dc.city as dest_city
            FROM shipments s
            LEFT JOIN destination_companies dc ON s.dest_company_id = dc.dest_company_id
            WHERE s.shipment_id = ${shipmentId}
        `;

        // 2. Get Items (Farmers)
        const itemsRes = await sql`
            SELECT 
                f.name as farmer_name,
                COALESCE(v.village_name, '') as village_name,
                cc.lot_no,
                si.bags_loaded as bags
            FROM shipment_items si
            JOIN crop_cycles cc ON si.crop_cycle_id = cc.crop_cycle_id
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            WHERE si.shipment_id = ${shipmentId}
            ORDER BY f.name
        `;

        // 3. Get Actual Loaded Varieties (New Logic)
        const varietiesRes = await sql`
            SELECT DISTINCT s.variety_name
            FROM shipment_items si
            JOIN crop_cycles cc ON si.crop_cycle_id = cc.crop_cycle_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE si.shipment_id = ${shipmentId}
        `;

        const varieties = varietiesRes.rows.map(r => r.variety_name);

        return {
            shipment: { ...shipmentRes.rows[0], varieties }, // Inject real varieties here
            items: itemsRes.rows
        };
    } catch (e) {
        console.error("Bill Fetch Error", e);
        return null;
    }
}

// --- 5. DELETE & RESTORE (Existing) ---
export async function deleteShipment(shipmentId: number) {
    const session = await auth();
    if (session?.user?.role !== 'admin') return { success: false, message: "Unauthorized" };

    try {
        await sql`BEGIN`;
        const items = await sql`SELECT crop_cycle_id, bags_loaded FROM shipment_items WHERE shipment_id = ${shipmentId}`;
        for (const item of items.rows) {
            await sql`UPDATE crop_cycles SET bags_remaining_to_load = bags_remaining_to_load + ${item.bags_loaded}, status = 'Weighed' WHERE crop_cycle_id = ${item.crop_cycle_id}`;
        }
        await sql`DELETE FROM shipment_items WHERE shipment_id = ${shipmentId}`;
        await sql`DELETE FROM shipments WHERE shipment_id = ${shipmentId}`;
        await sql`COMMIT`;
        
        revalidatePath('/admin-v2/shipments');
        return { success: true, message: "Shipment Deleted & Stock Restored" };
    } catch (e) {
        await sql`ROLLBACK`;
        return { success: false, message: "Delete Failed" };
    }
}