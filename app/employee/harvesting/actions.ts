// app/employee/harvesting/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define a type for our form state
type FormState = {
  message: string;
  success: boolean;
  errors?: {
    [key: string]: string[] | undefined;
  };
};

// Schema for validating the crop cycle ID
const CropCycleIdSchema = z.object({
  cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' })
});

// NEW: Schema for validating the sample data form
const SampleDataSchema = z.object({
    cropCycleId: z.coerce.number().gt(0),
    moisture: z.coerce.number().min(0, "Moisture cannot be negative."),
    purity: z.coerce.number().min(0, "Purity cannot be negative."),
    stone: z.coerce.number().min(0, "Stone % cannot be negative."),
    non_seed: z.coerce.number().min(0, "Non-seed % cannot be negative."),
    price: z.coerce.number().min(0, "Price cannot be negative.").optional(),
    userRole: z.enum(['Admin', 'Employee']),
});


// Server Action to mark a crop cycle as harvested
export async function startHarvesting(prevState: FormState, formData: FormData): Promise<FormState> {
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
  const harvestDate = new Date().toISOString();

  try {
    await sql`
      UPDATE crop_cycles
      SET
        status = 'Harvested',
        harvesting_date = ${harvestDate}
      WHERE crop_cycle_id = ${cropCycleId};
    `;
    revalidatePath('/employee/dashboard');
    return { message: 'Crop has been marked as harvested.', success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to start harvesting.', success: false };
  }
}

// Server Action to mark a sample as collected
export async function markSampleCollected(prevState: FormState, formData: FormData): Promise<FormState> {
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
    return { message: 'Database Error: Failed to mark sample as collected.', success: false };
  }
}

// NEW: Server action to process and save sample data
export async function enterSampleData(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = SampleDataSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: 'Invalid data provided. Please check all fields.',
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { data } = validatedFields;
    const samplingDate = new Date().toISOString();

    // Determine the next status based on user role and if price was provided
    const nextStatus = data.userRole === 'Admin' && data.price ? 'Priced' : 'Sampled';

    try {
        await sql`
            UPDATE crop_cycles
            SET
                status = ${nextStatus},
                sampling_date = ${samplingDate},
                sample_moisture = ${data.moisture},
                sample_purity = ${data.purity},
                sample_stone = ${data.stone},
                sample_non_seed = ${data.non_seed},
                final_price_per_quintal = ${data.price}
            WHERE crop_cycle_id = ${data.cropCycleId};
        `;
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Database Error: Failed to save sample data.', success: false };
    }

    revalidatePath('/employee/dashboard');
    revalidatePath('/admin/dashboard'); // Also revalidate admin dashboard
    redirect('/employee/dashboard'); // Redirect back to dashboard on success
}