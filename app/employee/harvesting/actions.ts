// app/employee/harvesting/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define a type for our form state (consistent across actions)
export type FormState = {
  message: string;
  success: boolean;
  errors?: {
    [key: string]: string[] | undefined;
  };
  cycleId?: number; // Optional: To identify which row the result applies to
};

// --- Zod Schemas ---

// Schema for validating startHarvesting
const StartHarvestingSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' }),
  goods_collection_method: z.string().min(1, { message: 'Collection method is required.' })
});

// Schema for validating the crop cycle ID (Used for markSampleCollected)
const CropCycleIdSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' })
});

// Schema for validating the sample data form (Refined Phase 4)
const SampleDataSchema = z.object({
    cropCycleId: z.coerce.number().gt(0),
    userRole: z.enum(['Admin', 'Employee']),
    goods_collection_method: z.string().min(1, "Collection method is required."),
    moisture: z.coerce.number().min(0, "Moisture cannot be negative."),
    purity: z.coerce.number().min(0, "Purity cannot be negative."),
    dust: z.coerce.number().min(0, "Dust % cannot be negative."),
    colors: z.string().min(1, "Color grade is required."),
    non_seed: z.string().min(1, "Non-seed value is required."),
    remarks: z.string().optional().nullable(),
    temporary_price_per_man: z.coerce.number().min(0, "Temporary price cannot be negative.").optional().nullable(),
});

// Schema for validating Set Temporary Price data (Phase 5)
const SetTempPriceSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' }),
  temporaryPrice: z.coerce.number({ message: "Price must be a number." })
                         .min(0, { message: 'Temporary price cannot be negative.' })
                         .gt(0, { message: 'Temporary price must be greater than zero.' })
});

// Schema for validating Verify Price data (Phase 6)
const VerifyPriceSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' }),
  finalPrice: z.coerce.number({ message: "Final price must be a number." })
                     .min(0, { message: 'Final price cannot be negative.' })
                     .gt(0, { message: 'Final price must be greater than zero.' })
});

// Schema for validating Weighing data (Phase 7)
const RecordWeighingSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' }),
  bagsWeighed: z.coerce.number({ message: "Bag count must be a number." })
                     .int({ message: "Bag count must be a whole number." })
                     .positive({ message: "Bag count must be greater than zero." }),
  bagsWeighedConfirm: z.coerce.number({ message: "Confirmation must be a number." })
                           .int({ message: "Confirmation must be a whole number." })
                           .positive({ message: "Confirmation must be greater than zero." }),
  // Include purchased/returned bags for calculation (passed from client)
  seedBagsPurchased: z.coerce.number().nullable().optional(),
  seedBagsReturned: z.coerce.number().nullable().optional(),
}).refine(data => data.bagsWeighed === data.bagsWeighedConfirm, {
  message: "Bag counts do not match.",
  path: ["bagsWeighedConfirm"], // Associate error with the confirmation field
});


// --- Server Actions ---

// Server Action to mark a crop cycle as harvested (Phase 2)
export async function startHarvesting(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const validatedFields = StartHarvestingSchema.safeParse({
    cropCycleId: formData.get('cropCycleId'),
    goods_collection_method: formData.get('goods_collection_method')
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return {
      message: errors.cropCycleId?.[0] || errors.goods_collection_method?.[0] || 'Invalid data provided.',
      success: false,
      errors: errors,
    };
  }

  const { cropCycleId, goods_collection_method } = validatedFields.data;
  const harvestDate = new Date().toISOString();

  try {
    await sql`
      UPDATE crop_cycles
      SET
        status = 'Harvested',
        harvesting_date = ${harvestDate},
        goods_collection_method = ${goods_collection_method}
      WHERE crop_cycle_id = ${cropCycleId};
    `;
    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/harvesting'); // Revalidate potential specific harvesting pages if any
    return { message: 'Crop has been marked as harvested.', success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to start harvesting.', success: false };
  }
}

// Server Action to mark a sample as collected (Phase 3)
export async function markSampleCollected(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const validatedFields = CropCycleIdSchema.safeParse({
    cropCycleId: formData.get('cropCycleId')
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.cropCycleId?.[0] || 'Invalid data provided.',
      success: false,
    };
  }

  const { cropCycleId } = validatedFields.data;
  const sampleCollectionDate = new Date().toISOString();

  try {
    await sql`
      UPDATE crop_cycles
      SET
        status = 'Sample Collected',
        sample_collection_date = ${sampleCollectionDate}
      WHERE crop_cycle_id = ${cropCycleId};
    `;
    revalidatePath('/employee/dashboard'); // Revalidate the dashboard where the list appears
    return { message: 'Sample has been marked as collected.', success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: `Database Error: Failed to mark sample as collected. Details: ${error instanceof Error ? error.message : String(error)}`, success: false };
  }
}


// Server action to process and save sample data (Phase 4)
export async function enterSampleData(prevState: FormState | null, formData: FormData): Promise<FormState> {
    const rawData = Object.fromEntries(formData.entries());
    // Ensure numeric fields potentially empty are treated as null for validation
    const dataToParse = {
        ...rawData,
        temporary_price_per_man: rawData.temporary_price_per_man === '' ? null : rawData.temporary_price_per_man,
        remarks: rawData.remarks === '' ? null : rawData.remarks,
        moisture: rawData.moisture === '' ? null : rawData.moisture, // Handle potentially empty strings
        purity: rawData.purity === '' ? null : rawData.purity,
        dust: rawData.dust === '' ? null : rawData.dust,
        colors: rawData.colors,
        non_seed: rawData.non_seed,
    };

    const validatedFields = SampleDataSchema.safeParse(dataToParse);

    if (!validatedFields.success) {
        console.log("Sample Data Validation Errors:", validatedFields.error.flatten().fieldErrors);
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
        return {
            message: firstError || 'Invalid sample data. Please check all required fields.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { data } = validatedFields;
    const samplingDate = new Date().toISOString();

    // Determine next status based on who entered the data and if a price was proposed
    const nextStatus = (data.userRole === 'Admin' && data.temporary_price_per_man != null && data.temporary_price_per_man > 0)
        ? 'Price Proposed'
        : 'Sampled';

    try {
      await sql`
          UPDATE crop_cycles
          SET
              status = ${nextStatus},
              sampling_date = ${samplingDate},
              goods_collection_method = ${data.goods_collection_method},
              sample_moisture = ${data.moisture},
              sample_purity = ${data.purity},
              dust_percentage = ${data.dust},
              color_grade = ${data.colors},
              sample_non_seed = ${data.non_seed},
              sample_remarks = ${data.remarks},
              temporary_price_per_man = ${data.temporary_price_per_man}
          WHERE crop_cycle_id = ${data.cropCycleId};
      `;
    } catch (error) {
        console.error('Database Error:', error);
        return { message: `Database Error: Failed to save sample data. Details: ${error instanceof Error ? error.message : String(error)}`, success: false };
    }

    // Revalidate paths where this data might be displayed
    revalidatePath('/employee/dashboard');
    revalidatePath('/admin/dashboard');

    // Redirect based on user role
    if (data.userRole === 'Admin') {
        redirect('/admin/dashboard'); // Redirect admin back to admin dashboard
    } else {
        redirect('/employee/dashboard'); // Redirect employee back to employee dashboard
    }
    // Note: Redirect might happen before revalidation completes, but Next.js handles this.
    // Return statement is technically unreachable due to redirect but needed for type safety.
    return { message: 'Sample data saved successfully.', success: true };
}

// Server Action: setTemporaryPrice (Phase 5)
export async function setTemporaryPrice(prevState: FormState | null, formData: FormData): Promise<FormState> {
    const rawTempPrice = formData.get('temporaryPrice');
     // Explicit check for empty string before Zod validation
     if (rawTempPrice === '') {
         return {
             cycleId: Number(formData.get('cropCycleId')) || undefined,
             message: 'Temporary price cannot be empty.',
             success: false,
         };
     }

    const validatedFields = SetTempPriceSchema.safeParse({
        cropCycleId: formData.get('cropCycleId'),
        temporaryPrice: rawTempPrice // Use the raw value here for Zod coercion
    });

    if (!validatedFields.success) {
        console.log("Set Temp Price Validation Errors:", validatedFields.error.flatten().fieldErrors);
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
        return {
            cycleId: Number(formData.get('cropCycleId')) || undefined,
            message: firstError || 'Invalid price entered.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { cropCycleId, temporaryPrice } = validatedFields.data;

    try {
        // Update the temporary price and set status to 'Price Proposed'
        const result = await sql`
            UPDATE crop_cycles
            SET
                temporary_price_per_man = ${temporaryPrice},
                status = 'Price Proposed'
            WHERE crop_cycle_id = ${cropCycleId}
              AND status = 'Sampled' -- Ensure we only update cycles that are 'Sampled'
            RETURNING crop_cycle_id;
        `;

        // Check if any row was actually updated
        if (result.rowCount === 0) {
             return {
                cycleId: cropCycleId,
                message: 'Failed to update: Cycle not found or status was not "Sampled".',
                success: false,
            };
        }

        revalidatePath('/admin/dashboard'); // Revalidate the admin dashboard

        return {
            cycleId: cropCycleId,
            message: 'Temporary price proposed successfully.',
            success: true,
        };

    } catch (error) {
        console.error('Database Error setting temporary price:', error);
        return {
            cycleId: cropCycleId,
            message: `Database Error: Failed to propose price. Details: ${error instanceof Error ? error.message : String(error)}`,
            success: false
        };
    }
}

// Server Action: verifyPrice (Phase 6)
export async function verifyPrice(prevState: FormState | null, formData: FormData): Promise<FormState> {
    const rawFinalPrice = formData.get('finalPrice');
    // Explicit check for empty string
    if (rawFinalPrice === '') {
        return {
            cycleId: Number(formData.get('cropCycleId')) || undefined,
            message: 'Final price cannot be empty.',
            success: false,
        };
    }

    const validatedFields = VerifyPriceSchema.safeParse({
        cropCycleId: formData.get('cropCycleId'),
        finalPrice: rawFinalPrice // Use raw value for Zod coercion
    });

    if (!validatedFields.success) {
        console.log("Verify Price Validation Errors:", validatedFields.error.flatten().fieldErrors);
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
        return {
            cycleId: Number(formData.get('cropCycleId')) || undefined,
            message: firstError || 'Invalid final price entered.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { cropCycleId, finalPrice } = validatedFields.data;
    const pricingDate = new Date().toISOString(); // Record when the price was finalized

    try {
        // Update the final price (purchase_rate), status, and pricing date
        const result = await sql`
            UPDATE crop_cycles
            SET
                purchase_rate = ${finalPrice}, -- Final price column
                status = 'Priced',
                pricing_date = ${pricingDate}   -- Set the pricing date
            WHERE crop_cycle_id = ${cropCycleId}
              AND status = 'Price Proposed' -- Ensure we only update cycles that are 'Price Proposed'
            RETURNING crop_cycle_id;
        `;

        // Check if any row was updated
        if (result.rowCount === 0) {
             return {
                cycleId: cropCycleId,
                message: 'Failed to update: Cycle not found or status was not "Price Proposed".',
                success: false,
            };
        }

        revalidatePath('/admin/dashboard'); // Revalidate admin dashboard
        revalidatePath('/employee/dashboard'); // Revalidate employee dashboard as status changes

        return {
            cycleId: cropCycleId,
            message: 'Final price confirmed successfully.',
            success: true,
        };

    } catch (error) {
        console.error('Database Error verifying price:', error);
        return {
            cycleId: cropCycleId,
            message: `Database Error: Failed to confirm price. Details: ${error instanceof Error ? error.message : String(error)}`,
            success: false
        };
    }
}


// Server Action: recordWeighing (Phase 7)
export async function recordWeighing(prevState: FormState | null, formData: FormData): Promise<FormState> {

    // Prepare data for validation (handle potential nulls passed from client)
    const dataToValidate = {
        cropCycleId: formData.get('cropCycleId'),
        bagsWeighed: formData.get('bagsWeighed'),
        bagsWeighedConfirm: formData.get('bagsWeighedConfirm'),
        seedBagsPurchased: formData.get('seedBagsPurchased') || null, // Default to null if missing/empty
        seedBagsReturned: formData.get('seedBagsReturned') || null,   // Default to null if missing/empty
    };

    const validatedFields = RecordWeighingSchema.safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.log("Record Weighing Validation Errors:", validatedFields.error.flatten().fieldErrors);
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        // Prioritize the mismatch error message if it exists
        const firstError = fieldErrors.bagsWeighedConfirm?.[0] || Object.values(fieldErrors).flat()[0];
        return {
            cycleId: Number(formData.get('cropCycleId')) || undefined,
            message: firstError || 'Invalid weighing data entered.',
            success: false,
            errors: fieldErrors,
        };
    }

    const {
        cropCycleId,
        bagsWeighed,
        seedBagsPurchased,
        seedBagsReturned
    } = validatedFields.data;

    // Calculate production flag
    const purchased = seedBagsPurchased ?? 0; // Default to 0 if null
    const returned = seedBagsReturned ?? 0;   // Default to 0 if null
    const finalSeedBags = purchased - returned;
    const threshold = finalSeedBags > 0 ? finalSeedBags * 50 : 0; // Calculate threshold (50x multiplier)
    const isProductionFlagged = threshold > 0 && bagsWeighed > threshold;

    const weighingDate = new Date().toISOString();

    console.log(`Recording weight for cycle ${cropCycleId}: Bags=${bagsWeighed}, Purchased=${purchased}, Returned=${returned}, Threshold=${threshold}, Flagged=${isProductionFlagged}`);

    try {
        // Update bag count, status, date, and flag
        const result = await sql`
            UPDATE crop_cycles
            SET
                quantity_in_bags = ${bagsWeighed},
                status = 'Weighed',
                weighing_date = ${weighingDate},
                is_production_flagged = ${isProductionFlagged}
            WHERE crop_cycle_id = ${cropCycleId}
              AND status = 'Priced' -- Ensure we only update cycles that are 'Priced'
            RETURNING crop_cycle_id;
        `;

        // Check if any row was updated
        if (result.rowCount === 0) {
             return {
                cycleId: cropCycleId,
                message: 'Failed to update: Cycle not found or status was not "Priced".',
                success: false,
            };
        }

        revalidatePath('/employee/dashboard'); // Revalidate employee dashboard
        revalidatePath('/admin/dashboard');   // Revalidate admin dashboard (pipeline status changes)

        return {
            cycleId: cropCycleId,
            message: `Weight recorded successfully (${bagsWeighed} bags). ${isProductionFlagged ? 'Production FLAGGED as high.' : ''}`,
            success: true,
        };

    } catch (error) {
        console.error('Database Error recording weight:', error);
        return {
            cycleId: cropCycleId,
            message: `Database Error: Failed to record weight. Details: ${error instanceof Error ? error.message : String(error)}`,
            success: false
        };
    }
}