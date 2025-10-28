// app/admin/shipments/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define state for the save action
export type SaveBillFormState = {
    message: string;
    success: boolean;
    errors?: {
        shipmentId?: string[];
        totalAmount?: string[];
        _form?: string[];
    };
};

const SaveBillSchema = z.object({
    shipmentId: z.coerce.number().int().positive(),
    totalAmount: z.coerce.number().min(0), // Allow 0, though unlikely
    // Add other fields from the bill if needed for validation/saving later
});

export async function saveShipmentBillAction(
    prevState: SaveBillFormState | undefined,
    formData: FormData
): Promise<SaveBillFormState> {
    console.log("[Server Action] saveShipmentBillAction called.");

    const validatedFields = SaveBillSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        console.error("Save Bill Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed.', success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { shipmentId, totalAmount } = validatedFields.data;
    const newStatus = 'Billed'; // Or 'Bill Generated'

    try {
        // Update shipment table with the total amount and new status
        const result = await sql`
            UPDATE shipments
            SET
                company_payment = ${totalAmount}, -- Confirmed column name
                status = ${newStatus}
            WHERE shipment_id = ${shipmentId}
              AND status = 'Dispatched'; -- Optional: Only update if dispatched? Or allow re-billing?
        `;

        if (result.rowCount === 0) {
             console.warn(`[Save Bill Action] Shipment ${shipmentId} not found or status was not 'Dispatched'.`);
             // Returning success: true might be okay if the goal is just saving the amount,
             // but returning false provides clearer feedback if the status update failed.
             // Let's return false for now if no row was updated.
             return { message: "Failed to update shipment. Status might not be 'Dispatched' or ID is invalid.", success: false };
        }

        console.log(`[Save Bill Action] Shipment ${shipmentId} updated. Total Amount: ${totalAmount}, Status: ${newStatus}`);

        // Revalidate relevant paths
        revalidatePath(`/admin/shipments/${shipmentId}/bill`);
        revalidatePath('/admin/dashboard'); // For pipeline status, etc.

        return { message: "Shipment bill amount saved and status updated.", success: true };

    } catch (error) {
        console.error(`[Save Bill Action] Error updating shipment ${shipmentId}:`, error);
        return {
            message: error instanceof Error ? error.message : "Database error saving bill amount.",
            success: false,
            errors: { _form: ["Failed to save bill details."] }
        };
    }
}