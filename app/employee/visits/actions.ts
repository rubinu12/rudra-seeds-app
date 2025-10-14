// app/employee/visits/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type FormState = {
  message: string;
  success: boolean;
};

// This server action will handle creating a new farm visit record
export async function createFarmVisit(prevState: FormState, formData: FormData): Promise<FormState> {
  // Extract data from the form
  const cropCycleId = Number(formData.get('crop_cycle_id'));
  const visitNumber = Number(formData.get('visit_number'));

  // Use a helper function to safely get form data
  const get = (key: string) => formData.get(key) as string | null;

  try {
    // For Visit 1
    if (visitNumber === 1) {
      const latitude = get('gps_latitude');
      const longitude = get('gps_longitude');
      
      // Update the farm's coordinates if they were captured
      if (latitude && longitude) {
        const farmId = Number(formData.get('farm_id')); // We'll need to pass this from the page
        await sql`
          UPDATE farms
          SET gps_latitude = ${latitude}, gps_longitude = ${longitude}
          WHERE farm_id = ${farmId};
        `;
      }
      
      await sql`
        INSERT INTO field_visits (
          crop_cycle_id, visit_number, visit_date, rouging_percentage, 
          irrigation_count, fertilizer_data, crop_condition, disease_data, 
          farmer_cooperation, remarks, next_visit_days
        ) VALUES (
          ${cropCycleId}, 1, ${get('visit_date')}, ${Number(get('rouging_percentage'))},
          ${Number(get('irrigation_count'))}, ${get('fertilizer_data')}, ${get('crop_condition')}, ${get('disease_data')},
          ${get('farmer_cooperation')}, ${get('remarks')}, ${Number(get('next_visit_days'))}
        );
      `;
    } 
    // For Visit 2
    else if (visitNumber === 2) {
      await sql`
        INSERT INTO field_visits (
          crop_cycle_id, visit_number, visit_date, rouging_percentage, 
          irrigation_count, fertilizer_data, crop_condition, disease_data, 
          farmer_cooperation, remarks
        ) VALUES (
          ${cropCycleId}, 2, ${get('visit_date')}, ${Number(get('rouging_remaining'))},
          ${Number(get('irrigation_count'))}, ${get('fertilizer_data')}, ${get('crop_condition')}, ${get('disease_data')},
          ${get('farmer_cooperation')}, ${get('remarks')}
        );
      `;
    }

  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Failed to save visit.', success: false };
  }

  // Success: revalidate the dashboard and redirect
  revalidatePath('/employee/dashboard');
  redirect('/employee/dashboard');
  
  // This part is for TypeScript; the redirect will stop execution
  return { message: 'Visit saved successfully.', success: true };
}