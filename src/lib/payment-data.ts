// lib/payment-data.ts
"use server";

import { sql } from '@vercel/postgres';
import { ReactNode } from 'react';
import type { BankAccount } from './definitions'; // Assuming BankAccount type is in definitions

// --- Types ---

// Type for the list displayed in the selection modal
export type CycleForPaymentSelection = {
    crop_cycle_id: number;
    farmer_name: string;
    lot_no: string | null;
    seed_variety: string;
    quantity_in_bags: number | null; // Bags weighed
};

// *** ADD StoredChequeDetail type if not already present from ChequePrintData ***
export type StoredChequeDetail = {
    payee_name: string;
    cheque_number: string; // Keep for reference, though not printed on cheque face usually
    amount: number;
    due_date: string; // YYYY-MM-DD
};

// Type for detailed data on the payment processing page AND bill page
export type FarmerPaymentDetails = {
    lot_no: ReactNode;
    final_payment: any;
    total_payment: number;
    // Cycle Info
    crop_cycle_id: number;
    farmer_id: number;
    quantity_in_bags: number; // Bags weighed
    purchase_rate: number; // Price per 20kg (Man)
    amount_remaining: number; // Seed cost deduction amount
    seed_variety: string; // *** ADD Seed Variety ***
    final_payment_date: string | null; // *** ADD Final Payment Date ***
    vehicle_number: string | null; // *** ADD Vehicle Number ***
    dispatch_date: string | null; // *** ADD Dispatch Date ***
    cheque_details: StoredChequeDetail[]; // *** ADD Parsed Cheque Details ***

    // Farmer Info
    farmer_name: string;
    village_name: string; // *** ADD Village Name ***

    // Bank Accounts (All for the farmer)
    bank_accounts: BankAccount[]; // Array of associated bank accounts

    // Calculated (can be done here or on client)
    gross_payment: number;
    net_payment: number;
};


// Type for the data needed by the print page
export type ChequePrintData = {
    payment_date: string | null; // Formatted DDMMYYYY
    cheques: StoredChequeDetail[];
};

// --- Data Fetching Functions ---

/**
 * Fetches crop cycles with status 'Loaded' or 'Cheque Generated' that are not yet paid.
 * Updated to allow fetching for bill printing after payment is processed.
 */
export async function getCyclesReadyForPayment(): Promise<CycleForPaymentSelection[]> {
    console.log("[Data Fetch] Getting cycles ready for payment ('Loaded' status)...");
    try {
        const result = await sql<CycleForPaymentSelection>`
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                cc.lot_no,
                s.variety_name as seed_variety,
                cc.quantity_in_bags -- Bags weighed
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Loaded' -- *** Keep as 'Loaded' for initial selection ***
              AND (cc.is_farmer_paid IS NULL OR cc.is_farmer_paid = FALSE)
            ORDER BY cc.weighing_date ASC NULLS LAST, f.name; -- Order by when weighed
        `;

        console.log(`[Data Fetch] Found ${result.rowCount} cycles ready for payment.`);
        // Ensure numbers are numbers
        return result.rows.map(row => ({
            ...row,
            crop_cycle_id: Number(row.crop_cycle_id),
            quantity_in_bags: row.quantity_in_bags !== null ? Number(row.quantity_in_bags) : null,
        }));

    } catch (error) {
        console.error("Database Error fetching cycles ready for payment:", error);
        throw new Error('Failed to fetch cycles ready for payment.');
    }
}

export async function getChequePrintDetails(cycleId: number): Promise<ChequePrintData | null> {
    if (isNaN(cycleId) || cycleId <= 0) {
        console.error("Invalid cycleId provided to getChequePrintDetails:", cycleId);
        return null;
    }
    console.log(`[Data Fetch] Getting cheque print details for cycle ID: ${cycleId}`);

    try {
        const result = await sql`
            SELECT
                final_payment_date, -- The date cheques were generated
                cheque_details      -- The JSONB/TEXT column with array of cheques
            FROM crop_cycles
            WHERE crop_cycle_id = ${cycleId}
              AND status = 'Cheque Generated' -- Ensure cheques have been generated
              AND cheque_details IS NOT NULL;
        `;

        if (result.rowCount === 0) {
            console.warn(`[Data Fetch] No valid cheque details found for cycle ${cycleId} (Status might not be 'Cheque Generated').`);
            return null;
        }

        const row = result.rows[0];
        let cheques: StoredChequeDetail[] = [];

        // Parse cheque_details JSON
        try {
            if (typeof row.cheque_details === 'string') {
                cheques = JSON.parse(row.cheque_details);
            } else if (typeof row.cheque_details === 'object' && row.cheque_details !== null) {
                // Handle case where postgres driver might parse JSONB automatically
                cheques = row.cheque_details;
            }
             // Basic validation of parsed structure
             if (!Array.isArray(cheques)) throw new Error("Parsed cheque_details is not an array");

             // Ensure amounts are numbers
             cheques = cheques.map(ch => ({ ...ch, amount: Number(ch.amount) }));


        } catch (parseError) {
             console.error(`[Data Fetch] Error parsing cheque_details JSON for cycle ${cycleId}:`, parseError);
             throw new Error('Failed to parse stored cheque details.');
        }

        // Format the payment date as DDMMYYYY
        let formattedDate: string | null = null;
        if (row.final_payment_date) {
            try {
                // Ensure the date is treated as UTC to avoid timezone issues during formatting
                const dateParts = String(row.final_payment_date).split('-'); // YYYY-MM-DD
                const date = new Date(Date.UTC(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])));

                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                const year = date.getUTCFullYear();
                formattedDate = `${day}${month}${year}`;
            } catch (dateError) {
                console.error(`[Data Fetch] Error formatting payment date for cycle ${cycleId}:`, dateError);
                // Keep formattedDate as null if formatting fails
            }
        }

        return {
            payment_date: formattedDate,
            cheques: cheques,
        };

    } catch (error) {
        console.error(`Database Error fetching cheque print details for cycle ${cycleId}:`, error);
        throw new Error('Failed to fetch cheque print details.');
    }
}
/**
 * Fetches detailed information needed to process payment or print bill for a single crop cycle.
 * Includes farmer's village and saved cheque details.
 * Allows fetching for 'Loaded' or 'Cheque Generated' status.
 */
export async function getFarmerPaymentDetails(cycleId: number): Promise<FarmerPaymentDetails | null> {
    if (isNaN(cycleId) || cycleId <= 0) {
        console.error("Invalid cycleId provided to getFarmerPaymentDetails:", cycleId);
        return null;
    }
    console.log(`[Data Fetch] Getting payment/bill details for cycle ID: ${cycleId}`);

    try {
        // Fetch cycle, farmer, village, seed, and potentially related shipment info
        // *** UPDATED QUERY: Added joins, columns, and status check ***
        const cycleResult = await sql`
            SELECT
                cc.crop_cycle_id,
                cc.farmer_id,
                cc.quantity_in_bags,   -- Bags weighed
                cc.purchase_rate,      -- Price per 20kg (Man)
                cc.amount_remaining,   -- Seed cost deduction
                cc.cheque_details,     -- Saved cheque details (JSON)
                TO_CHAR(cc.final_payment_date, 'YYYY-MM-DD') as final_payment_date, -- Format date
                f.name as farmer_name,
                v.village_name,        -- Farmer's village name
                s.variety_name as seed_variety, -- Seed variety name
                ship.vehicle_number,   -- Vehicle number from the *last* shipment this cycle was part of
                TO_CHAR(ship.dispatch_date, 'YYYY-MM-DD') as dispatch_date -- Dispatch date of that shipment
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN villages v ON fa.village_id = v.village_id -- Join villages table
            JOIN seeds s ON cc.seed_id = s.seed_id         -- Join seeds table
            -- Find the latest shipment containing this crop cycle
            LEFT JOIN (
                SELECT DISTINCT ON (si.crop_cycle_id) si.crop_cycle_id, sh.shipment_id, sh.vehicle_number, sh.dispatch_date
                FROM shipment_items si
                JOIN shipments sh ON si.shipment_id = sh.shipment_id
                WHERE si.crop_cycle_id = ${cycleId}
                ORDER BY si.crop_cycle_id, sh.dispatch_date DESC NULLS LAST, sh.creation_date DESC NULLS LAST
            ) as latest_shipment ON cc.crop_cycle_id = latest_shipment.crop_cycle_id
            LEFT JOIN shipments ship ON latest_shipment.shipment_id = ship.shipment_id
            WHERE cc.crop_cycle_id = ${cycleId}
              AND (cc.status = 'Loaded' OR cc.status = 'Cheque Generated') -- Allow both statuses
              AND (cc.is_farmer_paid IS NULL OR cc.is_farmer_paid = FALSE);
        `;


        if (cycleResult.rowCount === 0) {
            console.warn(`[Data Fetch] Cycle ${cycleId} not found, status not 'Loaded'/'Cheque Generated', or already paid.`);
            return null;
        }

        const cycleData = cycleResult.rows[0];
        const farmerId = Number(cycleData.farmer_id);

        // Fetch ALL bank accounts for this farmer (no change needed here)
        const bankAccountsResult = await sql<BankAccount>`
            SELECT account_id, farmer_id, account_name, account_no, ifsc_code, bank_name
            FROM bank_accounts
            WHERE farmer_id = ${farmerId};
        `;

        // Parse cheque_details JSON (similar to getChequePrintDetails)
        let cheques: StoredChequeDetail[] = [];
        if (cycleData.cheque_details) {
            try {
                if (typeof cycleData.cheque_details === 'string') {
                    cheques = JSON.parse(cycleData.cheque_details);
                } else if (typeof cycleData.cheque_details === 'object') {
                    cheques = cycleData.cheque_details; // Assume already parsed
                }
                if (!Array.isArray(cheques)) throw new Error("Parsed cheque_details is not an array");
                // Ensure amounts are numbers
                cheques = cheques.map(ch => ({ ...ch, amount: Number(ch.amount) }));
            } catch (parseError) {
                console.error(`[Data Fetch] Error parsing cheque_details JSON for bill (cycle ${cycleId}):`, parseError);
                // Decide how to handle - throw error or return empty array? Let's return empty for robustness.
                cheques = [];
            }
        }


        // Perform Calculations (same as before)
        const bagsWeighed = Number(cycleData.quantity_in_bags ?? 0);
        const purchaseRatePerMan = Number(cycleData.purchase_rate ?? 0);
        const seedDeduction = Number(cycleData.amount_remaining ?? 0);

        // Gross Payment = quantity_in_bags * purchase_rate * 2.5
        const grossPayment = bagsWeighed * purchaseRatePerMan * 2.5;
        const netPayment = grossPayment - seedDeduction;

        console.log(`[Data Fetch] Details for Cycle ${cycleId}: Gross= ${grossPayment}, Deduction=${seedDeduction}, Net=${netPayment}`);

        return {
            lot_no: cycleData.lot_no,
            final_payment: netPayment,
            total_payment: netPayment,
            crop_cycle_id: Number(cycleData.crop_cycle_id),
            farmer_id: farmerId,
            quantity_in_bags: bagsWeighed,
            purchase_rate: purchaseRatePerMan,
            amount_remaining: seedDeduction,
            farmer_name: cycleData.farmer_name,
            village_name: cycleData.village_name, // *** Assign village name ***
            seed_variety: cycleData.seed_variety, // *** Assign seed variety ***
            final_payment_date: cycleData.final_payment_date as string | null, // *** Assign date ***
            vehicle_number: cycleData.vehicle_number as string | null, // *** Assign vehicle ***
            dispatch_date: cycleData.dispatch_date as string | null, // *** Assign dispatch date ***
            cheque_details: cheques, // *** Assign parsed cheques ***
            bank_accounts: bankAccountsResult.rows.map(acc => ({ // Ensure correct types
                ...acc,
                account_id: Number(acc.account_id),
                farmer_id: Number(acc.farmer_id),
            })),
            gross_payment: grossPayment,
            net_payment: netPayment,
        };

    } catch (error) {
        console.error(`Database Error fetching payment details for cycle ${cycleId}:`, error);
        throw new Error('Failed to fetch farmer payment details.');
    }
}