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

// *** NEW: Schema for validating Set Temporary Price data (Phase 5) ***
const SetTempPriceSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' }),
  temporaryPrice: z.coerce.number({ message: "Price must be a number." })
                         .min(0, { message: 'Temporary price cannot be negative.' })
                         // Consider if price must be > 0
                         .gt(0, { message: 'Temporary price must be greater than zero.' })
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
    revalidatePath('/employee/harvesting');
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
    revalidatePath('/employee/dashboard');
    return { message: 'Sample has been marked as collected.', success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: `Database Error: Failed to mark sample as collected. Details: ${error instanceof Error ? error.message : String(error)}`, success: false };
  }
}


// Server action to process and save sample data (Phase 4)
export async function enterSampleData(prevState: FormState | null, formData: FormData): Promise<FormState> {
    const rawData = Object.fromEntries(formData.entries());
    const dataToParse = {
        ...rawData,
        temporary_price_per_man: rawData.temporary_price_per_man === '' ? null : rawData.temporary_price_per_man,
        remarks: rawData.remarks === '' ? null : rawData.remarks,
        moisture: rawData.moisture === '' ? null : rawData.moisture,
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

    revalidatePath('/employee/dashboard');
    revalidatePath('/admin/dashboard');

    if (data.userRole === 'Admin') {
        redirect('/admin/dashboard');
    } else {
        redirect('/employee/dashboard');
    }
}

// *** NEW: Server Action: setTemporaryPrice (Phase 5) ***
export async function setTemporaryPrice(prevState: FormState | null, formData: FormData): Promise<FormState> {

    const validatedFields = SetTempPriceSchema.safeParse({
        cropCycleId: formData.get('cropCycleId'),
        temporaryPrice: formData.get('temporaryPrice')
    });

     // Add handling for empty price string before validation if needed, though coerce should handle it
     const rawTempPrice = formData.get('temporaryPrice');
     if (rawTempPrice === '') {
         return {
             cycleId: Number(formData.get('cropCycleId')) || undefined,
             message: 'Temporary price cannot be empty.',
             success: false,
         };
     }

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
        const result = await sql`
            UPDATE crop_cycles
            SET
                temporary_price_per_man = ${temporaryPrice},
                status = 'Price Proposed'
            WHERE crop_cycle_id = ${cropCycleId}
              AND status = 'Sampled' -- Only update if status is 'Sampled'
            RETURNING crop_cycle_id;
        `;

        if (result.rowCount === 0) {
             return {
                cycleId: cropCycleId,
                message: 'Failed to update: Cycle not found or status was not "Sampled".',
                success: false,
            };
        }

        revalidatePath('/admin/dashboard');

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


// Placeholder/Future Server Action for Phase 6
// export async function verifyPrice(...) { /* ... TBD in Phase 6 ... */ }