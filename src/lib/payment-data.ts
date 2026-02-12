// src/lib/payment-data.ts
"use server";

import { sql } from '@vercel/postgres';
import type { BankAccount } from './definitions';

// --- Types ---

export type CycleForPaymentSelection = {
    crop_cycle_id: number;
    farmer_name: string;
    lot_no: string | null;
    seed_variety: string;
    quantity_in_bags: number | null;
};

export type StoredChequeDetail = {
    payee_name: string;
    cheque_number: string;
    amount: number;
    due_date: string;
};

export type FarmerPaymentDetails = {
    lot_no: string | null;
    bill_number: string | null; // [NEW] Added Bill Number
    final_payment: number;
    total_payment: number;
    crop_cycle_id: number;
    farmer_id: number;
    quantity_in_bags: number;
    purchase_rate: number;
    amount_remaining: number;
    seed_variety: string;
    final_payment_date: string | null;
    vehicle_number: string | null;
    dispatch_date: string | null;
    cheque_details: StoredChequeDetail[];
    farmer_name: string;
    village_name: string;
    bank_accounts: BankAccount[];
    gross_payment: number;
    net_payment: number;
};

export type ChequePrintData = {
    payment_date: string | null;
    cheques: StoredChequeDetail[];
};

// --- Data Fetching Functions ---

export async function getCyclesReadyForPayment(): Promise<CycleForPaymentSelection[]> {
    console.log("[Data Fetch] Getting cycles ready for payment ('Loaded' status)...");
    try {
        const result = await sql<CycleForPaymentSelection>`
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                cc.lot_no,
                s.variety_name as seed_variety,
                cc.quantity_in_bags
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Loaded'
              AND (cc.is_farmer_paid IS NULL OR cc.is_farmer_paid = FALSE)
            ORDER BY cc.weighing_date ASC NULLS LAST, f.name;
        `;

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
    if (isNaN(cycleId) || cycleId <= 0) return null;

    try {
        const result = await sql`
            SELECT final_payment_date, cheque_details
            FROM crop_cycles
            WHERE crop_cycle_id = ${cycleId}
              AND (status = 'paid' OR status = 'Paid' OR status = 'Cheque Generated' OR status = 'Cleared')
              AND cheque_details IS NOT NULL;
        `;

        if (result.rowCount === 0) return null;

        const row = result.rows[0];
        let cheques: StoredChequeDetail[] = [];

        try {
            if (typeof row.cheque_details === 'string') {
                cheques = JSON.parse(row.cheque_details);
            } else if (typeof row.cheque_details === 'object' && row.cheque_details !== null) {
                cheques = row.cheque_details as StoredChequeDetail[];
            }
             if (!Array.isArray(cheques)) throw new Error("Parsed cheque_details is not an array");
             cheques = cheques.map(ch => ({ ...ch, amount: Number(ch.amount) }));
        } catch (parseError) {
             console.error(`Error parsing cheque_details for cycle ${cycleId}`, parseError);
             throw new Error('Failed to parse stored cheque details.');
        }

        let formattedDate: string | null = null;
        if (row.final_payment_date) {
            try {
                const dateParts = String(row.final_payment_date).split('-');
                const date = new Date(Date.UTC(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])));
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                formattedDate = `${day}${month}${year}`;
            } catch (_e) {
                // Ignore formatting error
            }
        }

        return { payment_date: formattedDate, cheques: cheques };

    } catch (error) {
        console.error(`Database Error fetching cheque details for cycle ${cycleId}:`, error);
        throw new Error('Failed to fetch cheque print details.');
    }
}


export async function getFarmerPaymentDetails(cycleId: number): Promise<FarmerPaymentDetails | null> {
    if (isNaN(cycleId) || cycleId <= 0) return null;

    try {
        const cycleResult = await sql`
            SELECT
                cc.crop_cycle_id,
                cc.farmer_id,
                cc.quantity_in_bags,
                cc.purchase_rate,
                cc.amount_remaining,
                cc.cheque_details,
                cc.lot_no,
                cc.bill_number, -- [NEW] Fetching Bill Number
                TO_CHAR(cc.final_payment_date, 'YYYY-MM-DD') as final_payment_date,
                f.name as farmer_name,
                v.village_name,
                s.variety_name as seed_variety,
                ship.vehicle_number,
                TO_CHAR(ship.dispatch_date, 'YYYY-MM-DD') as dispatch_date
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN villages v ON fa.village_id = v.village_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            LEFT JOIN (
                SELECT DISTINCT ON (si.crop_cycle_id) si.crop_cycle_id, sh.shipment_id, sh.vehicle_number, sh.dispatch_date
                FROM shipment_items si
                JOIN shipments sh ON si.shipment_id = sh.shipment_id
                WHERE si.crop_cycle_id = ${cycleId}
                ORDER BY si.crop_cycle_id, sh.dispatch_date DESC NULLS LAST, sh.creation_date DESC NULLS LAST
            ) as latest_shipment ON cc.crop_cycle_id = latest_shipment.crop_cycle_id
            LEFT JOIN shipments ship ON latest_shipment.shipment_id = ship.shipment_id
            
            WHERE cc.crop_cycle_id = ${cycleId}
              AND (cc.status = 'paid' OR cc.status = 'Paid' OR cc.status = 'Cheque Generated' OR cc.status = 'Cleared' OR cc.status = 'Loaded');
        `;

        if (cycleResult.rowCount === 0) return null;

        const cycleData = cycleResult.rows[0];
        const farmerId = Number(cycleData.farmer_id);

        const bankAccountsResult = await sql<BankAccount>`
            SELECT account_id, farmer_id, account_name, account_no, ifsc_code, bank_name
            FROM bank_accounts
            WHERE farmer_id = ${farmerId};
        `;

        let cheques: StoredChequeDetail[] = [];
        if (cycleData.cheque_details) {
            try {
                if (typeof cycleData.cheque_details === 'string') {
                    cheques = JSON.parse(cycleData.cheque_details);
                } else if (typeof cycleData.cheque_details === 'object') {
                    cheques = cycleData.cheque_details as StoredChequeDetail[];
                }
                if (!Array.isArray(cheques)) throw new Error("Not an array");
                cheques = cheques.map(ch => ({ ...ch, amount: Number(ch.amount) }));
            } catch (_e) {
                cheques = [];
            }
        }

        const bagsWeighed = Number(cycleData.quantity_in_bags ?? 0);
        const purchaseRatePerMan = Number(cycleData.purchase_rate ?? 0);
        const seedDeduction = Number(cycleData.amount_remaining ?? 0);
        const grossPayment = bagsWeighed * purchaseRatePerMan * 2.5;
        const netPayment = grossPayment - seedDeduction;

        return {
            lot_no: cycleData.lot_no,
            bill_number: cycleData.bill_number as string | null, // [NEW] Return mapped bill_number
            final_payment: netPayment,
            total_payment: netPayment,
            crop_cycle_id: Number(cycleData.crop_cycle_id),
            farmer_id: farmerId,
            quantity_in_bags: bagsWeighed,
            purchase_rate: purchaseRatePerMan,
            amount_remaining: seedDeduction,
            farmer_name: cycleData.farmer_name,
            village_name: cycleData.village_name,
            seed_variety: cycleData.seed_variety,
            final_payment_date: cycleData.final_payment_date as string | null,
            vehicle_number: cycleData.vehicle_number as string | null,
            dispatch_date: cycleData.dispatch_date as string | null,
            cheque_details: cheques,
            bank_accounts: bankAccountsResult.rows.map(acc => ({
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