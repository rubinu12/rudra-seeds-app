// app/employee/harvesting/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define a type for our form state
type FormState = {
  message: string;
  success: boolean;
};

// Server Action to mark a crop cycle as harvested
export async function startHarvesting(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate the incoming data
  const schema = z.object({
    cropCycleId: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' })
  });

  const validatedFields = schema.safeParse({
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
    // 2. Update the database
    await sql`
      UPDATE crop_cycles
      SET 
        status = 'Harvested',
        harvesting_date = ${harvestDate}
      WHERE crop_cycle_id = ${cropCycleId};
    `;

    // 3. Revalidate the path to ensure the UI updates
    revalidatePath('/employee/dashboard'); // Revalidates the main list
    revalidatePath(`/employee/visits/${cropCycleId}`); // Revalidates the detail page

    return { message: 'Crop has been marked as harvested.', success: true };

  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to start harvesting.', success: false };
  }
}