"use server";

import { sql, db } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { formatISO } from 'date-fns';

// --- Types ---
export type CycleForPaymentSelection = {
    crop_cycle_id: number;
    farmer_name: string;
    lot_no: string | null;
    seed_variety: string;
    quantity_in_bags: number;
};

export type ProcessPaymentFormState = {
    message: string;
    success: boolean;
    errors?: {
        cycleId?: string[];
        cheque_details?: string[];
        dueDays?: string[];
        _form?: string[]; 
    };
    cycleId?: number;
};

// --- 1. FETCH ACTION (FIXED) ---
export async function getCyclesReadyForPayment(): Promise<CycleForPaymentSelection[]> {
    try {
        const result = await sql<CycleForPaymentSelection>`
            SELECT 
                cc.crop_cycle_id,
                COALESCE(f.name, 'Unknown Farmer') AS farmer_name,
                
                -- [FIX] Hybrid Lot Fetching: Prefers new table, falls back to old column
                COALESCE(
                    (
                        SELECT STRING_AGG(lot_number, ', ') 
                        FROM cycle_lots 
                        WHERE crop_cycle_id = cc.crop_cycle_id
                    ),
                    cc.lot_no
                ) AS lot_no,

                COALESCE(s.variety_name, 'Unknown Variety') AS seed_variety,
                cc.quantity_in_bags
            FROM crop_cycles cc
            LEFT JOIN farmers f ON cc.farmer_id = f.farmer_id
            LEFT JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE 
                (cc.status = 'Loaded' OR cc.status = 'loaded') 
            AND 
                (cc.is_farmer_paid IS NULL OR cc.is_farmer_paid = FALSE)
            ORDER BY cc.loading_date DESC
        `;
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching payment cycles:", error);
        return [];
    }
}

// --- Zod Schemas ---
const ChequeDetailSchema = z.object({
    payee_name: z.string().min(1, "Payee name cannot be empty."),
    cheque_number: z.string().min(1, "Cheque number cannot be empty."),
    amount: z.coerce.number().positive("Cheque amount must be positive."),
    due_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid due date format",
    }),
});

const ProcessPaymentSchema = z.object({
    cycleId: z.coerce.number().int().positive(),
    grossPayment: z.coerce.number(),
    netPayment: z.coerce.number().positive("Net payment must be positive."),
    dueDays: z.coerce.number().int().min(0).default(22),
    seedPaymentStatus: z.enum(['Paid', 'Credit', 'Partial']), 
    amountRemaining: z.coerce.number(),
    cheque_details: z.string().transform((str) => {
        try {
            const parsed = JSON.parse(str);
            const result = z.array(ChequeDetailSchema).safeParse(parsed);
            if (!result.success) return z.NEVER;
            if (result.data.length === 0) return z.NEVER;
            return result.data;
        } catch (_e) { return z.NEVER; }
    }),
}).refine(data => {
    const totalChequeAmount = data.cheque_details.reduce((sum, cheque) => sum + cheque.amount, 0);
    return Math.abs(totalChequeAmount - data.netPayment) < 0.01;
}, { message: "Total cheque amount mismatch", path: ["cheque_details"] });


// --- 2. PROCESS ACTION (WITH RETRY & COALESCE FIX) ---
// --- 2. PROCESS ACTION (WITH DEDICATED CONNECTION & TRANSACTIONS) ---
export async function processFarmerPaymentAction(
    _prevState: ProcessPaymentFormState | undefined,
    formData: FormData
): Promise<ProcessPaymentFormState> {
    const validatedFields = ProcessPaymentSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: 'Validation failed.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            cycleId: Number(formData.get('cycleId')) || undefined,
        };
    }

    const { cycleId, grossPayment, netPayment, cheque_details, seedPaymentStatus, amountRemaining } = validatedFields.data;
    const paymentDate = new Date();

    const chequeDetailsForDb = cheque_details.map(cheque => ({
        payee_name: cheque.payee_name,
        cheque_number: cheque.cheque_number,
        amount: cheque.amount,
        due_date: formatISO(new Date(cheque.due_date), { representation: 'date' }),
        status: "due" 
    }));

    const allDates = chequeDetailsForDb.map(c => new Date(c.due_date).getTime());
    const maxDueDateISO = formatISO(new Date(Math.max(...allDates)), { representation: 'date' });

    // 1. Acquire a dedicated Postgres client from the pool (Bypasses the REST API bug)
    const client = await db.connect();

    try {
        // 2. Start an isolated SQL Transaction
        await client.sql`BEGIN`;

        // --- [AUTO-BILL LOGIC START] ---
        const year = paymentDate.getFullYear();
        const prefix = `${year}-B-`;
        
        const lastBillRes = await client.sql`
            SELECT bill_number FROM crop_cycles 
            WHERE bill_number LIKE ${prefix + '%'}
            ORDER BY bill_number DESC 
            LIMIT 1
        `;

        let nextSeq = 1;
        if (lastBillRes.rowCount && lastBillRes.rowCount > 0 && lastBillRes.rows[0].bill_number) {
            const last = lastBillRes.rows[0].bill_number; 
            const parts = last.split('-'); 
            const lastNum = parseInt(parts[parts.length - 1], 10); 
            if (!isNaN(lastNum)) {
                nextSeq = lastNum + 1; 
            }
        }

        const autoBillNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
        // --- [AUTO-BILL LOGIC END] ---

        // 3. Perform the Update
        await client.sql`
            UPDATE crop_cycles
            SET
                bill_number = COALESCE(bill_number, ${autoBillNumber}),
                total_payment = ${grossPayment},
                final_payment = ${netPayment},
                seed_payment_status = ${seedPaymentStatus},
                amount_remaining = ${amountRemaining},
                cheque_due_date = ${maxDueDateISO}, 
                cheque_details = ${JSON.stringify(chequeDetailsForDb)}::jsonb,
                status = 'Paid',
                is_farmer_paid = FALSE,
                final_payment_date = ${formatISO(paymentDate, { representation: 'date' })}
            WHERE crop_cycle_id = ${cycleId} AND status IN ('Loaded', 'loaded', 'Paid', 'paid');
        `;

        // 4. Commit the Transaction to save changes safely
        await client.sql`COMMIT`;

    } catch (error) {
        // If anything fails, rollback the transaction so no partial data is saved
        await client.sql`ROLLBACK`;
        console.error("Database error during payment processing:", error);
        return { message: "Database connection failed. Please try again.", success: false, cycleId };
    } finally {
        // 5. CRITICAL: Always release the client back to the pool!
        client.release();
    }

    // Bust the cache for ALL related pages so the print view gets fresh data immediately
    revalidatePath(`/admin/dashboard`);
    revalidatePath(`/admin/payments/${cycleId}/process`);
    revalidatePath(`/admin/payments/${cycleId}/print-bill`);
    revalidatePath(`/admin/payments/${cycleId}/print-cheque`);

    // Redirect to printing
    redirect(`/admin/payments/${cycleId}/print-bill`);
}