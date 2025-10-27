// app/employee/loading/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Keep for potential future redirects
import { z } from 'zod';
import { auth } from '@/auth'; // Import auth to get current user

// --- Types ---

// Define FormState specifically for loading actions
export type LoadingFormState = {
    message: string;
    success: boolean;
    errors?: {
        // Errors specific to startNewShipment
        transportCompanyId?: string[];
        vehicleNo?: string[];
        capacityTonnes?: string[];
        driverName?: string[]; // Added driverName
        driverMobile?: string[];
        destinationCompanyId?: string[];
        // Errors specific to addBagsToShipment
        shipmentId?: string[];
        cropCycleId?: string[];
        bagsToLoad?: string[];
        selectedItemsJson?: string[]; // Keep if using JSON method for addBags
        // Errors specific to finalizeShipment & undo
        // shipmentId is already covered
        _form?: string[]; // For general/transaction errors
    };
    shipmentId?: number; // Optionally return the ID of the created/affected shipment
    cropCycleId?: number; // Optionally return the ID of the affected crop cycle
};

// Zod schema for the startNewShipment action
const StartShipmentSchema = z.object({
    transportCompanyId: z.coerce.number().int().positive({ message: 'Invalid Transport Company ID.' }),
    vehicleNo: z.string().trim().min(1, { message: 'Vehicle Number is required.' }),
    capacityTonnes: z.coerce.number().positive({ message: 'Capacity must be a positive number.' }),
    driverName: z.string().trim().min(1, { message: 'Driver Name is required.' }), // Added driverName validation
    driverMobile: z.string().optional().nullable(), // Optional mobile
    destinationCompanyId: z.coerce.number().int().positive({ message: 'Invalid Destination Company ID.' }),
});


// Zod schema for adding bags
const AddBagsSchema = z.object({
    shipmentId: z.coerce.number().int().positive({ message: "Invalid Shipment ID."}),
    cropCycleId: z.coerce.number().int().positive({ message: "Invalid Crop Cycle ID."}),
    bagsToLoad: z.coerce.number().int().positive({ message: "Bags to load must be a positive whole number."}),
});

// Zod schema for finalizing shipment
const FinalizeShipmentSchema = z.object({
    shipmentId: z.coerce.number().int().positive({ message: "Invalid Shipment ID."}),
});

// Zod schema for undoing last bag addition
const UndoShipmentItemSchema = z.object({
    shipmentId: z.coerce.number().int().positive({ message: "Invalid Shipment ID."}),
});


// Bag capacity calculation constant
const TONNES_TO_BAGS_MULTIPLIER = 20;

// --- Server Action: startNewShipment ---

export async function startNewShipment(prevState: LoadingFormState | undefined, formData: FormData): Promise<LoadingFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Authentication required.", success: false, errors: { _form: ["User not logged in."] } };
    }
    let employeeId: number;
    try {
        employeeId = parseInt(session.user.id, 10);
        if (isNaN(employeeId)) throw new Error("Invalid user ID format.");
    } catch (e) {
         console.error("Failed to parse employee ID:", e);
         return { message: "Invalid user session.", success: false, errors: { _form: ["Invalid user ID in session."] } };
    }

    const validatedFields = StartShipmentSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        console.error("Start Shipment Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed. Please check the shipment details.',
            success: false, errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const {
        transportCompanyId, vehicleNo, capacityTonnes, driverName,
        driverMobile, destinationCompanyId,
    } = validatedFields.data;

    const targetBagCapacity = Math.floor(capacityTonnes * TONNES_TO_BAGS_MULTIPLIER);
    if (targetBagCapacity <= 0) {
         return {
            message: 'Calculation Error: Capacity must result in at least 1 bag.',
            success: false, errors: { capacityTonnes: ['Invalid capacity resulting in zero bags.'] }
        };
    }
    const creationDate = new Date();

    try {
        const result = await sql`
            INSERT INTO shipments (
                shipment_company_id, dest_company_id, vehicle_number, driver_name,
                driver_mobile, status, target_bag_capacity, total_bags,
                employee_ids, creation_date, is_company_payment_received
            ) VALUES (
                ${transportCompanyId}, ${destinationCompanyId}, ${vehicleNo}, ${driverName},
                ${driverMobile || null}, 'Loading', ${targetBagCapacity}, 0,
                ${`{${employeeId}}`}, ${creationDate.toISOString()}, FALSE
            ) RETURNING shipment_id`;

        if (result.rows.length === 0) throw new Error("Failed to insert shipment record and get ID.");
        const newShipmentId = result.rows[0].shipment_id;
        console.log(`New shipment ${newShipmentId} started by employee ${employeeId}. Target: ${targetBagCapacity} bags.`);
        revalidatePath('/employee/dashboard');
        return {
            message: `New shipment #${newShipmentId} started. Target capacity: ${targetBagCapacity} bags.`,
            success: true, shipmentId: newShipmentId,
        };
    } catch (error) {
        console.error('Database Error starting new shipment:', error);
        return {
            message: 'Database Error: Failed to start new shipment.',
            success: false,
            errors: { _form: [error instanceof Error ? error.message : 'An unexpected database error occurred.'] }
        };
    }
}

// --- Server Action: addBagsToShipment ---
export async function addBagsToShipment(prevState: LoadingFormState | undefined, formData: FormData): Promise<LoadingFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Authentication required.", success: false, errors: { _form: ["User not logged in."] } };
    }
     let employeeId: number;
     try {
         employeeId = parseInt(session.user.id, 10);
         if (isNaN(employeeId)) throw new Error("Invalid user ID.");
     } catch (e) {
         console.error("Failed to parse employee ID for addBags:", e);
         return { message: "Invalid user session.", success: false, errors: { _form: ["Invalid user ID."] } };
     }

    const validatedFields = AddBagsSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        console.error("Add Bags Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed. Please check the bags to load.',
            success: false, errors: validatedFields.error.flatten().fieldErrors,
            shipmentId: Number(formData.get('shipmentId')) || undefined,
            cropCycleId: Number(formData.get('cropCycleId')) || undefined,
        };
    }

    const { shipmentId, cropCycleId, bagsToLoad } = validatedFields.data;
    const loadingTimestamp = new Date();

    const client = await sql.connect();
    try {
        await client.query('BEGIN');

        const cycleCheckResult = await client.query(
            `SELECT bags_remaining_to_load FROM crop_cycles WHERE crop_cycle_id = $1 FOR UPDATE`,
            [cropCycleId]
        );
        if (cycleCheckResult.rows.length === 0) throw new Error(`Crop cycle ID ${cropCycleId} not found.`);
        const currentBagsRemaining = cycleCheckResult.rows[0].bags_remaining_to_load;
        if (bagsToLoad > currentBagsRemaining) {
            throw new Error(`Attempted to load ${bagsToLoad} bags, but only ${currentBagsRemaining} are available for cycle ${cropCycleId}.`);
        }

        // Insert into shipment_items (includes added_at implicitly via DEFAULT NOW())
        await client.query(
            `INSERT INTO shipment_items (shipment_id, crop_cycle_id, bags_loaded) VALUES ($1, $2, $3)`,
            [shipmentId, cropCycleId, bagsToLoad]
        );

        const newBagsRemaining = currentBagsRemaining - bagsToLoad;
        const isFullyLoaded = newBagsRemaining <= 0;
        const newStatus = isFullyLoaded ? 'Loaded' : 'Weighed';
        const loadingDate = isFullyLoaded ? loadingTimestamp.toISOString() : null;

        await client.query(
            `UPDATE crop_cycles
             SET bags_remaining_to_load = $1, status = $2, loading_date = $3
             WHERE crop_cycle_id = $4`,
            [newBagsRemaining, newStatus, loadingDate, cropCycleId]
        );

        const updateShipmentResult = await client.query(
            `UPDATE shipments
             SET total_bags = total_bags + $1, employee_ids = ARRAY_APPEND(employee_ids, $2)
             WHERE shipment_id = $3 AND status = 'Loading'
            RETURNING shipment_id`,
            [bagsToLoad, employeeId, shipmentId]
        );
        if (updateShipmentResult.rowCount === 0) {
            throw new Error(`Shipment ${shipmentId} could not be updated (status might not be 'Loading').`);
        }

        await client.query('COMMIT');
        revalidatePath('/employee/dashboard');

        console.log(`${bagsToLoad} bags from cycle ${cropCycleId} added to shipment ${shipmentId} by employee ${employeeId}. Cycle fully loaded: ${isFullyLoaded}`);
        return {
            message: `${bagsToLoad} bags added successfully.`,
            success: true, shipmentId: shipmentId, cropCycleId: cropCycleId,
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database Transaction Error adding bags:', error);
        return {
            message: 'Database Error: Failed to add bags to shipment.',
            success: false,
            errors: { _form: [error instanceof Error ? error.message : 'An unexpected database error occurred.'] },
            shipmentId: shipmentId, cropCycleId: cropCycleId,
        };
    } finally {
        client.release();
    }
}


// --- Server Action: finalizeShipment ---
export async function finalizeShipment(prevState: LoadingFormState | undefined, formData: FormData): Promise<LoadingFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Authentication required.", success: false, errors: { _form: ["User not logged in."] } };
    }

    const validatedFields = FinalizeShipmentSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        console.error("Finalize Shipment Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Invalid Shipment ID provided.', success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            shipmentId: Number(formData.get('shipmentId')) || undefined,
        };
    }
    const { shipmentId } = validatedFields.data;
    const dispatchTimestamp = new Date();

    const client = await sql.connect();
    try {
        await client.query('BEGIN');
        const shipmentCheckResult = await client.query(
            `SELECT total_bags, target_bag_capacity, status FROM shipments WHERE shipment_id = $1 FOR UPDATE`,
            [shipmentId]
        );
        if (shipmentCheckResult.rows.length === 0) throw new Error(`Shipment ${shipmentId} not found.`);
        const { total_bags, target_bag_capacity, status } = shipmentCheckResult.rows[0];
        if (status !== 'Loading') throw new Error(`Shipment ${shipmentId} is not 'Loading' (current: ${status}).`);
        if (total_bags <= 0) throw new Error(`Shipment ${shipmentId} cannot dispatch with zero bags.`);
        const lowerBound = target_bag_capacity - 20;
        const upperBound = target_bag_capacity + 20;
        if (total_bags < lowerBound || total_bags > upperBound) {
            throw new Error(`Total bags (${total_bags}) outside allowed range (${lowerBound}-${upperBound}) for target (${target_bag_capacity}).`);
        }
        const updateResult = await client.query(
            `UPDATE shipments SET status = 'Dispatched', dispatch_date = $1 WHERE shipment_id = $2 AND status = 'Loading'`,
            [dispatchTimestamp.toISOString(), shipmentId]
        );
        if (updateResult.rowCount === 0) throw new Error(`Failed to update shipment ${shipmentId} status.`);
        await client.query('COMMIT');
        revalidatePath('/employee/dashboard');
        console.log(`Shipment ${shipmentId} dispatched with ${total_bags} bags.`);
        return {
            message: `Shipment #${shipmentId} dispatched successfully with ${total_bags} bags.`,
            success: true, shipmentId: shipmentId,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database Error finalizing shipment:', error);
        return {
            message: 'Database Error: Failed to finalize shipment.', success: false,
            errors: { _form: [error instanceof Error ? error.message : 'An unexpected database error occurred.'] },
            shipmentId: shipmentId,
        };
    } finally {
        client.release();
    }
}

// --- Server Action: undoLastBagAddition ---
export async function undoLastBagAddition(prevState: LoadingFormState | undefined, formData: FormData): Promise<LoadingFormState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Authentication required.", success: false, errors: { _form: ["User not logged in."] } };
    }

    const validatedFields = UndoShipmentItemSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        console.error("Undo Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return { message: 'Invalid Shipment ID for undo.', success: false, errors: validatedFields.error.flatten().fieldErrors };
    }
    const { shipmentId } = validatedFields.data;

    const client = await sql.connect();
    try {
        await client.query('BEGIN');

        // Find the most recent shipment_items record *for this shipment* using item_id
        const lastItemResult = await client.query(
            // *** UPDATED: Select item_id ***
            `SELECT item_id, crop_cycle_id, bags_loaded
             FROM shipment_items
             WHERE shipment_id = $1
             ORDER BY added_at DESC -- Relies on the added_at column
             LIMIT 1
             FOR UPDATE`, // Lock the item row
            [shipmentId]
        );
        if (lastItemResult.rows.length === 0) throw new Error(`No items found on shipment ${shipmentId} to undo.`);
        // *** UPDATED: Destructure item_id ***
        const { item_id, crop_cycle_id, bags_loaded: bags_to_undo } = lastItemResult.rows[0];

        // Fetch & Lock Shipment - Ensure it's still 'Loading'
        const shipmentCheckResult = await client.query(
            `SELECT status FROM shipments WHERE shipment_id = $1 FOR UPDATE`,
            [shipmentId]
        );
        if (shipmentCheckResult.rows.length === 0 || shipmentCheckResult.rows[0].status !== 'Loading') {
            throw new Error(`Shipment ${shipmentId} is not in 'Loading' status or not found.`);
        }

        // Fetch & Lock Cycle
        await client.query(`SELECT 1 FROM crop_cycles WHERE crop_cycle_id = $1 FOR UPDATE`, [crop_cycle_id]);

        // Delete the last item using item_id
        await client.query(
            // *** UPDATED: Delete using item_id ***
            `DELETE FROM shipment_items WHERE item_id = $1`,
            [item_id]
        );

        // Update Shipment (decrement total_bags)
        await client.query(
            `UPDATE shipments SET total_bags = total_bags - $1 WHERE shipment_id = $2`,
            [bags_to_undo, shipmentId]
        );

        // Update Crop Cycle (increment bags_remaining, revert status/date)
        await client.query(
            `UPDATE crop_cycles
             SET bags_remaining_to_load = bags_remaining_to_load + $1,
                 status = 'Weighed', -- Must revert to Weighed
                 loading_date = NULL -- Clear loading date
             WHERE crop_cycle_id = $2`,
            [bags_to_undo, crop_cycle_id]
        );

        await client.query('COMMIT');
        revalidatePath('/employee/dashboard');

        console.log(`Undid addition of ${bags_to_undo} bags for cycle ${crop_cycle_id} from shipment ${shipmentId}.`);
        return {
            message: `Last addition (${bags_to_undo} bags) undone successfully.`,
            success: true, shipmentId: shipmentId, cropCycleId: crop_cycle_id,
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database Transaction Error undoing bag addition:', error);
        return {
            message: 'Database Error: Failed to undo last operation.',
            success: false,
            errors: { _form: [error instanceof Error ? error.message : 'An unexpected database error occurred.'] },
            shipmentId: shipmentId,
        };
    } finally {
        client.release();
    }
}