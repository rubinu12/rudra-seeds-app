// app/admin/cycles/edit/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCycleDetailsForEditing, CycleDetailsForEditing } from '@/src/lib/admin-data';
import { getCurrentSeedPrice } from '@/src/lib/data'; // Import function to get seed price by year if needed, or adjust logic

// --- State Types ---

// Return type for fetch action
type FetchActionResult = {
    success: boolean;
    data?: CycleDetailsForEditing | null;
    error?: string;
};

// Return type for update action (similar to other FormState types)
export type UpdateCycleFormState = {
    message: string;
    success: boolean;
    errors?: {
        sowing_date?: string[];
        seed_bags_purchased?: string[];
        goods_collection_method?: string[];
        seed_bags_returned?: string[];
        amount_paid_back?: string[];
        _form?: string[]; // For general errors
    };
};

// --- Zod Schema for Update Validation ---
const UpdateCycleSchema = z.object({
    crop_cycle_id: z.coerce.number().int().positive(),
    crop_cycle_year: z.coerce.number().int().positive(), // Needed for seed price
    original_amount_paid: z.coerce.number().min(0).default(0), // Original amount paid before this edit
    sowing_date: z.string().date({ message: "Invalid sowing date format." }),
    seed_bags_purchased: z.coerce.number().int({ message: "Purchased bags must be a whole number." }).min(0, { message: "Purchased bags cannot be negative." }),
    goods_collection_method: z.string().min(1, { message: "Collection method is required." }),
    // Allow empty string for returned bags, treat as 0
    seed_bags_returned: z.preprocess(
        (val) => (val === '' ? null : val), // Convert empty string to null before validation
        z.coerce.number().int({ message: "Returned bags must be a whole number." }).min(0, { message: "Returned bags cannot be negative." }).nullable().default(null)
    ),
    amount_paid_back: z.coerce.number({ message: "Amount paid back must be a number." }).min(0, { message: "Amount paid back cannot be negative." }).default(0),
}).refine(data => {
    // Ensure returned bags are not more than purchased bags
    const returned = data.seed_bags_returned ?? 0;
    return returned <= data.seed_bags_purchased;
}, {
    message: "Returned bags cannot exceed purchased bags.",
    path: ["seed_bags_returned"], // Associate error with this field
}).refine(data => {
    // Ensure amount paid back does not exceed original amount paid
    return data.amount_paid_back <= data.original_amount_paid;
}, {
    message: "Amount paid back cannot exceed the original amount paid.",
    path: ["amount_paid_back"],
});


// --- Server Actions ---

export async function fetchCycleDetailsAction(cycleId: number): Promise<FetchActionResult> {
    console.log(`[Server Action] fetchCycleDetailsAction called for ID: ${cycleId}`);
    if (isNaN(cycleId) || cycleId <= 0) {
        console.error("[Server Action] Invalid cycleId received.");
        return { success: false, error: "Invalid Cycle ID provided." };
    }
    try {
        const details = await getCycleDetailsForEditing(cycleId);
        if (!details) {
            console.warn(`[Server Action] No details found for cycle ID: ${cycleId}`);
            return { success: false, error: `No details found for Cycle ID ${cycleId}.` };
        }
        console.log(`[Server Action] Successfully fetched details for cycle ID: ${cycleId}`);
        return { success: true, data: details };
    } catch (error) {
        console.error(`[Server Action] Error fetching details for cycle ID ${cycleId}:`, error);
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred while fetching cycle details." };
    }
}

// *** ADDED updateCycleAction ***
export async function updateCycleAction(prevState: UpdateCycleFormState | undefined, formData: FormData): Promise<UpdateCycleFormState> {
    console.log("[Server Action] updateCycleAction called.");

    // 1. Validate form data
    const validatedFields = UpdateCycleSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.error("Update Cycle Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: 'Validation failed. Please check the fields.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { data } = validatedFields;
    const bagsReturned = data.seed_bags_returned ?? 0; // Use 0 if null

    try {
        // 2. Fetch seed price for the cycle's year
        // NOTE: Adjust getCurrentSeedPrice if it needs to accept a year parameter
        const seedPricePerBag = await getCurrentSeedPrice(/* data.crop_cycle_year */); // Pass year if needed
        if (seedPricePerBag <= 0) {
            throw new Error("Could not retrieve a valid seed price for calculation.");
        }

        // 3. Perform Calculations
        const netBagsKept = data.seed_bags_purchased - bagsReturned;
        const newSeedCost = netBagsKept * seedPricePerBag;
        const netAmountPaid = data.original_amount_paid - data.amount_paid_back;
        const newAmountRemaining = newSeedCost - netAmountPaid;

        // Determine new payment status
        let newPaymentStatus = 'Credit'; // Default
        if (netAmountPaid >= newSeedCost) {
            newPaymentStatus = 'Paid';
        } else if (netAmountPaid > 0) {
            newPaymentStatus = 'Partial';
        }

        console.log(`[Update Action] Calculations for Cycle ${data.crop_cycle_id}:`);
        console.log(`  - Price/Bag: ${seedPricePerBag}`);
        console.log(`  - Purchased: ${data.seed_bags_purchased}, Returned: ${bagsReturned}, Net Kept: ${netBagsKept}`);
        console.log(`  - New Seed Cost: ${newSeedCost}`);
        console.log(`  - Original Paid: ${data.original_amount_paid}, Paid Back: ${data.amount_paid_back}, Net Paid: ${netAmountPaid}`);
        console.log(`  - New Remaining: ${newAmountRemaining}`);
        console.log(`  - New Status: ${newPaymentStatus}`);


        // 4. Update Database
        await sql`
            UPDATE crop_cycles
            SET
                sowing_date = ${data.sowing_date},
                seed_bags_purchased = ${data.seed_bags_purchased},
                goods_collection_method = ${data.goods_collection_method},
                seed_bags_returned = ${bagsReturned > 0 ? bagsReturned : null}, -- Store null if 0 returned
                seed_cost = ${newSeedCost},
                amount_paid = ${netAmountPaid},
                amount_remaining = ${newAmountRemaining},
                seed_payment_status = ${newPaymentStatus}
                -- Potentially update other fields like last_modified_date if needed
            WHERE crop_cycle_id = ${data.crop_cycle_id};
        `;

        // 5. Revalidate and Return Success
        revalidatePath('/admin/dashboard'); // Revalidate dashboard (data might affect summaries)
        // Optionally revalidate other paths if needed

        console.log(`[Server Action] Successfully updated cycle ID: ${data.crop_cycle_id}`);
        return { message: "Cycle details updated successfully.", success: true };

    } catch (error) {
        console.error(`[Server Action] Error updating cycle ID ${data.crop_cycle_id}:`, error);
        return {
            message: error instanceof Error ? error.message : "An unknown error occurred while updating the cycle.",
            success: false,
            errors: { _form: [error instanceof Error ? error.message : "Database update failed."] }
        };
    }
}