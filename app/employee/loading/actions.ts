// app/employee/loading/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Keep for potential future redirects
import { z } from 'zod';
import { auth } from '@/auth'; // Import auth to get current user

// --- Types ---

// Define FormState specifically for this action
export type CreateShipmentFormState = {
    message: string;
    success: boolean;
    errors?: {
        transportCompanyId?: string[];
        vehicleNo?: string[];
        capacityTonnes?: string[];
        driverMobile?: string[];
        destinationCompanyId?: string[];
        selectedItemsJson?: string[];
        _form?: string[]; // For general/transaction errors
    };
    shipmentId?: number; // Optionally return the ID of the created shipment
};

// Type for the items parsed from JSON
const SelectedItemSchema = z.object({
    crop_cycle_id: z.number().int().positive(),
    bags_loaded: z.number().int().positive(),
    // farmer_name and lot_no are not needed for the action logic, only for client-side display
});

// Zod schema for the main form data including the JSON string
const CreateShipmentSchema = z.object({
    transportCompanyId: z.coerce.number().int().positive({ message: 'Invalid Transport Company ID.' }),
    vehicleNo: z.string().trim().min(1, { message: 'Vehicle Number is required.' }),
    capacityTonnes: z.coerce.number().positive({ message: 'Capacity must be a positive number.' }),
    driverMobile: z.string().optional().nullable(), // Optional mobile
    destinationCompanyId: z.coerce.number().int().positive({ message: 'Invalid Destination Company ID.' }),
    selectedItemsJson: z.string().min(1, { message: 'No items selected for loading.' })
        .transform((jsonString, ctx) => { // Parse and validate the JSON string
            try {
                const parsed = JSON.parse(jsonString);
                // Validate that it's an array of our selected item shape
                const itemsSchema = z.array(SelectedItemSchema).min(1, { message: "At least one item must be selected." });
                const result = itemsSchema.safeParse(parsed);
                if (!result.success) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Invalid format for selected items.",
                    });
                    return z.NEVER; // Prevents further validation/transform
                }
                return result.data;
            } catch (e) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Selected items data is not valid JSON.",
                });
                return z.NEVER;
            }
        }),
});

// --- Server Action: createShipment ---

export async function createShipment(prevState: CreateShipmentFormState | undefined, formData: FormData): Promise<CreateShipmentFormState> {
    // 1. Get current user session
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Authentication required.", success: false, errors: { _form: ["User not logged in."] } };
    }
    const employeeId = parseInt(session.user.id, 10); // Assuming user.id is the employee's user_id

    // 2. Validate form data
    const validatedFields = CreateShipmentSchema.safeParse({
        transportCompanyId: formData.get('transportCompanyId'),
        vehicleNo: formData.get('vehicleNo'),
        capacityTonnes: formData.get('capacityTonnes'),
        driverMobile: formData.get('driverMobile'),
        destinationCompanyId: formData.get('destinationCompanyId'),
        selectedItemsJson: formData.get('selectedItemsJson'),
    });

    if (!validatedFields.success) {
        console.error("Shipment Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed. Please check the shipment details and selected items.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const {
        transportCompanyId,
        vehicleNo,
        // capacityTonnes, // Not directly stored in DB, derived from bags
        driverMobile,
        destinationCompanyId,
        selectedItemsJson: selectedItems // Renamed after transform
    } = validatedFields.data;

    const totalBagsCalculated = selectedItems.reduce((sum, item) => sum + item.bags_loaded, 0);
    const dispatchDate = new Date(); // Use current date/time

    // 3. Database Transaction
    const client = await sql.connect(); // Get a client for transaction
    try {
        await client.query('BEGIN'); // Start transaction

        // Insert into shipments table
        const shipmentInsertResult = await client.query(
            `INSERT INTO shipments (shipment_company_id, dest_company_id, vehicle_number, driver_mobile, dispatch_date, status, total_bags, employee_ids)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING shipment_id`,
            [
                transportCompanyId,
                destinationCompanyId,
                vehicleNo,
                driverMobile || null, // Ensure null if empty/optional
                dispatchDate,
                'Dispatched', // Initial status
                totalBagsCalculated,
                `{${employeeId}}` // Format as PostgreSQL array literal
            ]
        );

        if (shipmentInsertResult.rows.length === 0) {
            throw new Error("Failed to insert shipment record.");
        }
        const newShipmentId = shipmentInsertResult.rows[0].shipment_id;

        // Process each selected item
        for (const item of selectedItems) {
            // Re-fetch current bags_remaining_to_load WITHIN the transaction for safety
            const cycleCheckResult = await client.query(
                `SELECT bags_remaining_to_load FROM crop_cycles WHERE crop_cycle_id = $1 FOR UPDATE`, // Lock row
                [item.crop_cycle_id]
            );

            if (cycleCheckResult.rows.length === 0) {
                throw new Error(`Crop cycle ID ${item.crop_cycle_id} not found.`);
            }
            const currentBagsRemaining = cycleCheckResult.rows[0].bags_remaining_to_load;

            if (item.bags_loaded > currentBagsRemaining) {
                throw new Error(`Attempted to load ${item.bags_loaded} bags for cycle ${item.crop_cycle_id}, but only ${currentBagsRemaining} were available.`);
            }

            // Insert into shipment_items
            await client.query(
                `INSERT INTO shipment_items (shipment_id, crop_cycle_id, bags_loaded)
                 VALUES ($1, $2, $3)`,
                [newShipmentId, item.crop_cycle_id, item.bags_loaded]
            );

            // Update crop_cycles
            const newBagsRemaining = currentBagsRemaining - item.bags_loaded;
            const newStatus = (newBagsRemaining <= 0) ? 'Loaded' : 'Weighed'; // Update status if fully loaded
            const loadingDate = (newBagsRemaining <= 0) ? dispatchDate : null; // Set loading date only if fully loaded

            await client.query(
                `UPDATE crop_cycles
                 SET bags_remaining_to_load = $1,
                     status = $2,
                     loading_date = $3
                 WHERE crop_cycle_id = $4`,
                [newBagsRemaining, newStatus, loadingDate, item.crop_cycle_id]
            );
        }

        await client.query('COMMIT'); // Commit transaction

        // 4. Revalidation
        revalidatePath('/employee/dashboard');
        revalidatePath('/employee/harvesting/loading/new'); // Revalidate the form page itself
        revalidatePath('/admin/dashboard'); // Revalidate admin dashboard

        console.log(`Shipment ${newShipmentId} created successfully.`);
        return {
            message: `Shipment #${newShipmentId} created successfully with ${totalBagsCalculated} bags.`,
            success: true,
            shipmentId: newShipmentId,
        };

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error('Database Transaction Error creating shipment:', error);
        return {
            message: 'Database Error: Failed to create shipment.',
            success: false,
            errors: { _form: [error instanceof Error ? error.message : 'An unexpected database error occurred.'] }
        };
    } finally {
        client.release(); // Release the client back to the pool
    }
}