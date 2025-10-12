// src/app/admin/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

// Define a type for our form state for better TypeScript support
type FormState = {
  error: string;
  success: boolean;
};

// Action to add a new landmark - Corrected Signature
export async function addLandmark(prevState: FormState, formData: FormData): Promise<FormState> {
  const landmarkName = formData.get('landmark_name') as string;

  if (!landmarkName) {
    return { error: 'Landmark name is required.', success: false };
  }

  try {
    await sql`
      INSERT INTO landmarks (landmark_name)
      VALUES (${landmarkName})
    `;
    revalidatePath('/admin/dashboard'); // Revalidate to refresh data
    return { success: true, error: '' };
  } catch (error) {
    console.error('Database Error:', error);
    if ((error as any).code === '23505') {
       return { error: 'This landmark already exists.', success: false };
    }
    return { error: 'Failed to add landmark.', success: false };
  }
}

// Action to add a new seed variety - UPDATED with new fields
export async function addSeedVariety(prevState: FormState, formData: FormData): Promise<FormState> {
    const varietyName = formData.get('variety_name') as string;
    const cropType = formData.get('crop_type') as string;
    const companyName = formData.get('company_name') as string;
    // The value from a checkbox is "on" if checked, and null if not. We convert it to a boolean.
    const isDefault = formData.get('is_default') === 'on';

    if (!varietyName || !cropType || !companyName) {
        return { error: 'All fields are required.', success: false };
    }

    try {
        await sql`
            INSERT INTO seeds (variety_name, crop_type, company_name, is_default)
            VALUES (${varietyName}, ${cropType}, ${companyName}, ${isDefault})
        `;
        revalidatePath('/admin/dashboard');
        return { success: true, error: '' };
    } catch (error) {
        console.error('Database Error:', error);
        if ((error as any).code === '23505') {
            return { error: 'This seed variety already exists.', success: false };
        }
        return { error: 'Failed to add seed variety.', success: false };
    }
}