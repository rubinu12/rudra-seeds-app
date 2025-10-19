// app/employee/visits/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define the shape of the form data and validation rules
const VisitSchema = z.object({
  crop_cycle_id: z.coerce.number().gt(0, { message: 'Invalid Crop Cycle ID.' }),
  farm_id: z.coerce.number().gt(0, { message: 'Invalid Farm ID.' }),
  visit_number: z.coerce.number().min(1).max(2),
  visit_date: z.string().date(),
  gps_latitude: z.string().optional(),
  gps_longitude: z.string().optional(),
  rouging_percentage: z.coerce.number().min(0).max(100).optional(),
  rouging_remaining: z.coerce.number().min(0).max(100).optional(),
  irrigation_count: z.coerce.number().min(0, { message: 'Irrigation count cannot be negative.' }),
  fertilizer_data: z.string().nullable(),
  crop_condition: z.enum(['Good', 'Medium', 'Bad']),
  disease_data: z.string().nullable(),
  farmer_cooperation: z.enum(['Best', 'Good', 'Worst']),
  remarks: z.string().trim().optional(),
  next_visit_days: z.coerce.number().min(0).optional(),
});


type FormState = {
  message: string;
  success: boolean;
};

// This server action will handle creating a new farm visit record
export async function createFarmVisit(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate form data
  const validatedFields = VisitSchema.safeParse(Object.fromEntries(formData.entries()));
  
  // If validation fails, return the errors
  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] || 'Missing Fields. Failed to Create Visit.',
      success: false,
    };
  }

  const { data } = validatedFields;

  try {
    // For Visit 1
    if (data.visit_number === 1) {
      // Update the farm's coordinates if they were captured
      if (data.gps_latitude && data.gps_longitude) {
        await sql`
          UPDATE farms
          SET gps_latitude = ${data.gps_latitude}, gps_longitude = ${data.gps_longitude}
          WHERE farm_id = ${data.farm_id};
        `;
      }
      
      await sql`
        INSERT INTO field_visits (
          crop_cycle_id, visit_number, visit_date, rouging_percentage, 
          irrigation_count, fertilizer_data, crop_condition, disease_data, 
          farmer_cooperation, remarks, next_visit_days
        ) VALUES (
          ${data.crop_cycle_id}, 1, ${data.visit_date}, ${data.rouging_percentage},
          ${data.irrigation_count}, ${data.fertilizer_data}, ${data.crop_condition}, ${data.disease_data},
          ${data.farmer_cooperation}, ${data.remarks}, ${data.next_visit_days}
        );
      `;
    } 
    // For Visit 2
    else if (data.visit_number === 2) {
      await sql`
        INSERT INTO field_visits (
          crop_cycle_id, visit_number, visit_date, rouging_percentage, 
          irrigation_count, fertilizer_data, crop_condition, disease_data, 
          farmer_cooperation, remarks
        ) VALUES (
          ${data.crop_cycle_id}, 2, ${data.visit_date}, ${data.rouging_remaining},
          ${data.irrigation_count}, null, ${data.crop_condition}, null,
          ${data.farmer_cooperation}, ${data.remarks}
        );
      `;
    }

  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to save visit.', success: false };
  }

  // Success: revalidate the dashboard and redirect
  revalidatePath('/employee/dashboard');
  redirect('/employee/dashboard');
}