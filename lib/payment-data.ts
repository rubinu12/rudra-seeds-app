// lib/payment-data.ts
"use server";

import { sql } from '@vercel/postgres';
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

// Type for detailed data on the payment processing page
export type FarmerPaymentDetails = {
    // Cycle Info
    crop_cycle_id: number;
    farmer_id: number;
    quantity_in_bags: number; // Bags weighed
    purchase_rate: number; // Price per 20kg (Man)
    amount_remaining: number; // Seed cost deduction amount
    // Farmer Info
    farmer_name: string;
    // Bank Accounts (All for the farmer)
    bank_accounts: BankAccount[]; // Array of associated bank accounts
    // Calculated (can be done here or on client)
    gross_payment: number;
    net_payment: number;
};

export type StoredChequeDetail = {
    payee_name: string;
    cheque_number: string; // Keep for reference, though not printed on cheque face usually
    amount: number;
    due_date: string; // YYYY-MM-DD
};

// Type for the data needed by the print page
export type ChequePrintData = {
    payment_date: string | null; // Formatted DDMMYYYY
    cheques: StoredChequeDetail[];
};

// --- Data Fetching Functions ---

/**
 * Fetches crop cycles with status 'Loaded' that are not yet paid.
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
            WHERE cc.status = 'Loaded'
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

        } catch (parseError) {
             console.error(`[Data Fetch] Error parsing cheque_details JSON for cycle ${cycleId}:`, parseError);
             throw new Error('Failed to parse stored cheque details.');
        }

        // Format the payment date as DDMMYYYY
        let formattedDate: string | null = null;
        if (row.final_payment_date) {
            try {
                const date = new Date(row.final_payment_date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                const year = date.getFullYear();
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
 * Fetches detailed information needed to process payment for a single crop cycle,
 * including all bank accounts for the associated farmer, and calculates payment amounts.
 */
export async function getFarmerPaymentDetails(cycleId: number): Promise<FarmerPaymentDetails | null> {
    if (isNaN(cycleId) || cycleId <= 0) {
        console.error("Invalid cycleId provided to getFarmerPaymentDetails:", cycleId);
        return null;
    }
    console.log(`[Data Fetch] Getting payment details for cycle ID: ${cycleId}`);

    try {
        // Fetch cycle and farmer data
        const cycleResult = await sql`
            SELECT
                cc.crop_cycle_id,
                cc.farmer_id,
                cc.quantity_in_bags, -- Bags weighed
                cc.purchase_rate,    -- Price per 20kg (Man)
                cc.amount_remaining, -- Seed cost deduction
                f.name as farmer_name
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            WHERE cc.crop_cycle_id = ${cycleId}
              AND cc.status = 'Loaded' -- Ensure it's ready for payment
              AND (cc.is_farmer_paid IS NULL OR cc.is_farmer_paid = FALSE);
        `;

        if (cycleResult.rowCount === 0) {
            console.warn(`[Data Fetch] Cycle ${cycleId} not found, not 'Loaded', or already paid.`);
            return null;
        }

        const cycleData = cycleResult.rows[0];
        const farmerId = Number(cycleData.farmer_id);

        // Fetch ALL bank accounts for this farmer
        const bankAccountsResult = await sql<BankAccount>`
            SELECT account_id, farmer_id, account_name, account_no, ifsc_code, bank_name
            FROM bank_accounts
            WHERE farmer_id = ${farmerId};
        `;

        // Perform Calculations
        const bagsWeighed = Number(cycleData.quantity_in_bags ?? 0);
        const purchaseRatePerMan = Number(cycleData.purchase_rate ?? 0);
        const seedDeduction = Number(cycleData.amount_remaining ?? 0);

        // Gross Payment = quantity_in_bags * purchase_rate * 2.5
        const grossPayment = bagsWeighed * purchaseRatePerMan * 2.5;
        const netPayment = grossPayment - seedDeduction;

        console.log(`[Data Fetch] Details for Cycle ${cycleId}: Gross= ${grossPayment}, Deduction=${seedDeduction}, Net=${netPayment}`);

        return {
            crop_cycle_id: Number(cycleData.crop_cycle_id),
            farmer_id: farmerId,
            quantity_in_bags: bagsWeighed,
            purchase_rate: purchaseRatePerMan,
            amount_remaining: seedDeduction,
            farmer_name: cycleData.farmer_name,
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