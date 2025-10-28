// app/admin/payments/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Import redirect
import { z } from 'zod';
import { addDays, formatISO } from 'date-fns'; // Using date-fns for reliable date addition

// --- State Type ---
export type ProcessPaymentFormState = {
    message: string;
    success: boolean;
    errors?: {
        cycleId?: string[];
        cheque_details?: string[];
        _form?: string[]; // For general/validation errors
    };
    // Add cycleId to state for potential use in redirect or UI feedback
    cycleId?: number;
};

// --- Zod Schemas ---

// Schema for a single cheque entry coming from the form (JSON string)
const ChequeDetailSchema = z.object({
    payee_name: z.string().min(1, "Payee name cannot be empty."),
    cheque_number: z.string().min(1, "Cheque number cannot be empty."),
    amount: z.coerce.number().positive("Cheque amount must be positive."),
    // due_date will be added by the server action
});

// Schema for the main form data
const ProcessPaymentSchema = z.object({
    cycleId: z.coerce.number().int().positive(),
    grossPayment: z.coerce.number(), // Used for saving
    netPayment: z.coerce.number().positive("Net payment must be positive."),
    cheque_details: z.string().transform((str, ctx) => { // Parse and validate JSON string
        try {
            const parsed = JSON.parse(str);
            const result = z.array(ChequeDetailSchema).safeParse(parsed);
            if (!result.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid cheque details format or content.",
                });
                return z.NEVER;
            }
            if (result.data.length === 0) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "At least one cheque must be entered.",
                });
                return z.NEVER;
            }
            return result.data;
        } catch (e) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON format for cheque details." });
            return z.NEVER;
        }
    }),
}).refine(data => {
    // Check if the sum of cheque amounts matches the net payment (with tolerance)
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
            cycleId: Number(formData.get('cycleId')) || undefined, // Return cycleId on error too
        };
    }

    const { cycleId, grossPayment, netPayment, cheque_details } = validatedFields.data;
    const paymentDate = new Date(); // Use current date/time for recording when processed
    const dueDate = addDays(paymentDate, 22); // Calculate due date (current date + 22 days)
    const dueDateISO = formatISO(dueDate, { representation: 'date' }); // Format as 'YYYY-MM-DD'

    // Prepare cheque_details array with due date for the JSON column
    const chequeDetailsForDb = cheque_details.map(cheque => ({
        payee_name: cheque.payee_name,
        cheque_number: cheque.cheque_number,
        amount: cheque.amount,
        // Include due date in the JSON structure itself
        due_date: dueDateISO
    }));

    const newStatus = 'Cheque Generated';

    try {
        console.log(`[Process Payment Action] Updating Cycle ID: ${cycleId}`);
        // Update Database
        const result = await sql`
            UPDATE crop_cycles
            SET
                total_payment = ${grossPayment},         -- Store Gross Payment
                final_payment = ${netPayment},     -- Store Net Payment
                cheque_due_date = ${dueDateISO},          -- Update the single due date column
                cheque_details = ${JSON.stringify(chequeDetailsForDb)}, -- Store cheque details array as JSON
                status = ${newStatus},
                is_farmer_paid = FALSE                    -- Ensure remains FALSE
                -- final_payment_date column is NOT updated here per user request
            WHERE crop_cycle_id = ${cycleId}
              AND status = 'Loaded'
              AND (is_farmer_paid IS NULL OR is_farmer_paid = FALSE);
        `;

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
        // Add revalidatePath for the cheque clearance list page later

        console.log(`[Server Action] Successfully processed payment for cycle ID: ${cycleId}, Status: ${newStatus}`);

        // On success, redirect to the print page instead of returning state
        // The client-side form won't see the success message directly

    } catch (error) {
        console.error(`[Server Action] Error processing payment for cycle ID ${cycleId}:`, error);
        return {
            message: error instanceof Error ? error.message : "Database error processing payment.",
            success: false,
            errors: { _form: ["Failed to update cycle details in database."] },
            cycleId: cycleId,
        };
    }

    // --- Redirect on Success ---
    // This happens outside the try block if the update was successful (rowCount > 0)
    // and no error was caught.
    redirect(`/admin/payments/${cycleId}/print-cheque`);

    // Note: The return statement below is technically unreachable due to the redirect,
    // but might be needed for strict TypeScript or linting rules.
    // return { message: "Processing...", success: true, cycleId: cycleId };
}