"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addDays, formatISO } from 'date-fns';

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

// --- 1. FETCH ACTION (Using 'loading_date') ---
export async function getCyclesReadyForPayment(): Promise<CycleForPaymentSelection[]> {
    try {
        console.log("🔍 Fetching cycles ready for payment...");

        const result = await sql<CycleForPaymentSelection>`
            SELECT 
                cc.crop_cycle_id,
                COALESCE(f.name, 'Unknown Farmer') AS farmer_name,
                cc.lot_no,
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
        
        console.log(`✅ Found ${result.rowCount} cycles ready for payment.`);
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
    // NEW: Allow date string. Validation ensures it's a valid date.
    due_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid due date format",
    }),
});

const ProcessPaymentSchema = z.object({
    cycleId: z.coerce.number().int().positive(),
    grossPayment: z.coerce.number(),
    netPayment: z.coerce.number().positive("Net payment must be positive."),
    dueDays: z.coerce.number().int().min(0).default(22),
    cheque_details: z.string().transform((str, ctx) => {
        try {
            const parsed = JSON.parse(str);
            const result = z.array(ChequeDetailSchema).safeParse(parsed);
            if (!result.success) return z.NEVER;
            if (result.data.length === 0) return z.NEVER;
            return result.data;
        } catch (e) { return z.NEVER; }
    }),
}).refine(data => {
    const totalChequeAmount = data.cheque_details.reduce((sum, cheque) => sum + cheque.amount, 0);
    return Math.abs(totalChequeAmount - data.netPayment) < 0.01;
}, { message: "Total cheque amount mismatch", path: ["cheque_details"] });


// --- 2. PROCESS ACTION (Unchanged) ---
export async function processFarmerPaymentAction(
    prevState: ProcessPaymentFormState | undefined,
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

    const { cycleId, grossPayment, netPayment, cheque_details } = validatedFields.data;
    const paymentDate = new Date();

    // Map the incoming cheques. We TRUST the due_date coming from the client now.
    const chequeDetailsForDb = cheque_details.map(cheque => ({
        payee_name: cheque.payee_name,
        cheque_number: cheque.cheque_number,
        amount: cheque.amount,
        // Ensure standard ISO format for DB
        due_date: formatISO(new Date(cheque.due_date), { representation: 'date' }),
        status: "due" // <--- UPDATED: Matches your legacy data format (lowercase)
    }));

    // Find the latest due date to set as the overall 'cheque_due_date' column (for sorting/alerts)
    const allDates = chequeDetailsForDb.map(c => new Date(c.due_date).getTime());
    const maxDueDateISO = formatISO(new Date(Math.max(...allDates)), { representation: 'date' });

    try {
        await sql`
            UPDATE crop_cycles
            SET
                total_payment = ${grossPayment},
                final_payment = ${netPayment},
                cheque_due_date = ${maxDueDateISO}, -- Set this to the furthest cheque date
                cheque_details = ${JSON.stringify(chequeDetailsForDb)},
                status = 'paid',
                is_farmer_paid = FALSE,
                final_payment_date = ${formatISO(paymentDate, { representation: 'date' })}
            WHERE crop_cycle_id = ${cycleId} AND (status = 'Loaded' OR status = 'loaded');
        `;

        revalidatePath(`/admin/dashboard`);
        revalidatePath(`/admin/payments/${cycleId}/process`);
    } catch (error) {
        return { message: "Database error.", success: false, cycleId };
    }

    redirect(`/admin/payments/${cycleId}/print-bill`);
}