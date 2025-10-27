// app/employee/loading/data.ts
"use server";

import { sql } from '@vercel/postgres';

// Define the type for the shipment data needed in the LoadingView list
export type InProgressShipment = {
    shipment_id: number;
    vehicle_number: string;
    driver_name: string;
    target_bag_capacity: number;
    total_bags: number;
    // Optional: Add company names if needed later by joining
    // shipment_company_name?: string;
    // dest_company_name?: string;
};

/**
 * Fetches shipments that are currently in 'Loading' status.
 */
export async function getInProgressShipments(): Promise<InProgressShipment[]> {
    try {
        // Fetch necessary fields for the shipment list display
        const data = await sql<InProgressShipment>`
            SELECT
                s.shipment_id,
                s.vehicle_number,
                s.driver_name,
                s.target_bag_capacity,
                s.total_bags
                -- Optionally join shipment_companies sc ON s.shipment_company_id = sc.company_id
                -- Optionally join destination_companies dc ON s.dest_company_id = dc.dest_company_id
                -- SELECT ..., sc.company_name as shipment_company_name, dc.company_name as dest_company_name ...
            FROM shipments s
            WHERE s.status = 'Loading'
            ORDER BY s.creation_date DESC; -- Show newest loading shipments first
        `;
        return data.rows;
    } catch (error) {
        console.error('Database Error fetching in-progress shipments:', error);
        throw new Error('Failed to fetch shipments in loading status.');
    }
}