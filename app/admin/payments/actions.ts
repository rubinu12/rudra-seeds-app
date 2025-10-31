// app/admin/payments/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addDays, formatISO } from 'date-fns';

// --- State Type (Unchanged) ---
export type ProcessPaymentFormState = {
    message: string;
    success: boolean;
    errors?: {
        cycleId?: string[];
        cheque_details?: string[];
        dueDays?: string[]; // *** ADD dueDays error field ***
        _form?: string[]; 
    };
    cycleId?: number;
};

// --- Zod Schemas ---

// ChequeDetailSchema (Unchanged)
const ChequeDetailSchema = z.object({
    payee_name: z.string().min(1, "Payee name cannot be empty."),
    cheque_number: z.string().min(1, "Cheque number cannot be empty."),
    amount: z.coerce.number().positive("Cheque amount must be positive."),
});

// *** UPDATE ProcessPaymentSchema ***
const ProcessPaymentSchema = z.object({
    cycleId: z.coerce.number().int().positive(),
    grossPayment: z.coerce.number(),
    netPayment: z.coerce.number().positive("Net payment must be positive."),
    
    // *** ADD dueDays validation ***
    dueDays: z.coerce.number()
                   .int({ message: "Due days must be a whole number."})
                   .min(0, { message: "Due days cannot be negative."})
                   .default(22), // Keep 22 as a fallback default

    cheque_details: z.string().transform((str, ctx) => { // (Unchanged)
        try {
            const parsed = JSON.parse(str);
            const result = z.array(ChequeDetailSchema).safeParse(parsed);
            if (!result.success) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid cheque details format." });
                return z.NEVER;
            }
            if (result.data.length === 0) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one cheque must be entered." });
                 return z.NEVER;
            }
            return result.data;
        } catch (e) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON for cheque details." });
            return z.NEVER;
        }
    }),
}).refine(data => { // (Unchanged)
    const totalChequeAmount = data.cheque_details.reduce((sum, cheque) => sum + cheque.amount, 0);
    return Math.abs(totalChequeAmount - data.netPayment) < 0.01;
}, {
    message: "Total cheque amount does not match the Net Payment Due.",
    path: ["cheque_details"],
});


// --- Server Action ---

export async function processFarmerPaymentAction(
    prevState: ProcessPaymentFormState | undefined,
    formData: FormData
): Promise<ProcessPaymentFormState> {
    console.log("[Server Action] processFarmerPaymentAction called.");

    const validatedFields = ProcessPaymentSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.error("Process Payment Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed. Please check payment and cheque details.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            cycleId: Number(formData.get('cycleId')) || undefined,
        };
    }

    // *** UPDATE destructuring to include dueDays ***
    const { cycleId, grossPayment, netPayment, dueDays, cheque_details } = validatedFields.data;
    
    const paymentDate = new Date(); // Use current date/time for recording when processed
    
    // *** UPDATE dueDate calculation to use dynamic days ***
    const dueDate = addDays(paymentDate, dueDays);
    const dueDateISO = formatISO(dueDate, { representation: 'date' }); // Format as 'YYYY-MM-DD'

    // Prepare cheque_details array with due date for the JSON column (Unchanged)
    const chequeDetailsForDb = cheque_details.map(cheque => ({
        payee_name: cheque.payee_name,
        cheque_number: cheque.cheque_number,
        amount: cheque.amount,
        due_date: dueDateISO
    }));

    const newStatus = 'Cheque Generated';
    const finalPaymentDateISO = formatISO(paymentDate, { representation: 'date' });

    try {
        console.log(`[Process Payment Action] Updating Cycle ID: ${cycleId}. Due date set to: ${dueDateISO} (${dueDays} days)`);
        
        // Update Database (SQL query is unchanged, it just uses the new variables)
        const result = await sql`
            UPDATE crop_cycles
            SET
                total_payment = ${grossPayment},
                final_payment = ${netPayment},
                cheque_due_date = ${dueDateISO},          -- This now holds the dynamic due date
                cheque_details = ${JSON.stringify(chequeDetailsForDb)},
                status = ${newStatus},
                is_farmer_paid = FALSE,
                final_payment_date = ${finalPaymentDateISO}
            WHERE crop_cycle_id = ${cycleId}
              AND status = 'Loaded'
              AND (is_farmer_paid IS NULL OR is_farmer_paid = FALSE);
        `;

        // ... (rest of the try/catch/redirect logic is unchanged) ...
        if (result.rowCount === 0) {
            console.warn(`[Process Payment Action] Cycle ${cycleId} not found, status not 'Loaded', or already marked as paid.`);
            return {
                message: "Failed to process payment: Cycle not found, status incorrect, or already paid.",
                success: false,
                cycleId: cycleId,
            };
        }

        revalidatePath(`/admin/dashboard`);
        revalidatePath(`/admin/payments/${cycleId}/process`);
        revalidatePath(`/admin/payments/${cycleId}/print-bill`);
        revalidatePath(`/admin/payments/${cycleId}/print-cheque`);

        console.log(`[Server Action] Successfully processed payment for cycle ID: ${cycleId}, Status: ${newStatus}`);

    } catch (error) {
        console.error(`[Server Action] Error processing payment for cycle ID ${cycleId}:`, error);
        return {
            message: error instanceof Error ? error.message : "Database error processing payment.",
            success: false,
            errors: { _form: ["Failed to update cycle details in database."] },
            cycleId: cycleId,
        };
    }

    redirect(`/admin/payments/${cycleId}/print-bill`);
}