// app/admin/settings/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define and EXPORT a universal type for our form state responses
export type FormState = {
  message: string;
  success: boolean;
  error?: string; // Keep error for consistency with other forms
};

const SETTINGS_PATH = '/admin/settings';

// --- App Mode Management ---

/**
 * Updates the global mode for the employee application.
 */
export async function updateEmployeeMode(newMode: 'Growing' | 'Harvesting'): Promise<FormState> {
  const schema = z.enum(['Growing', 'Harvesting']);
  const validatedMode = schema.safeParse(newMode);

  if (!validatedMode.success) {
    return { message: 'Invalid mode specified.', success: false };
  }

  try {
    await sql`
      UPDATE app_settings
      SET setting_value = ${validatedMode.data}
      WHERE setting_key = 'current_employee_mode';
    `;
    revalidatePath(SETTINGS_PATH);
    revalidatePath('/employee/dashboard');
    return { message: `Employee app mode switched to ${validatedMode.data}.`, success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to update app mode.', success: false };
  }
}

// --- Master Data Schemas for Validation ---
const LandmarkSchema = z.object({ landmark_name: z.string().min(3, 'Name must be at least 3 characters.') });
const VillageSchema = z.object({ village_name: z.string().min(3, 'Name must be at least 3 characters.') });
const DestCompanySchema = z.object({ company_name: z.string().min(3, 'Name must be at least 3 characters.') });
const SeedVarietySchema = z.object({
  variety_name: z.string().min(3, 'Variety name is required.'),
  crop_type: z.string().min(3, 'Crop type is required.'),
  company_name: z.string().min(3, 'Company name is required.'),
  is_default: z.boolean().default(false),
});
const ShipCompanySchema = z.object({
  company_name: z.string().min(3, 'Company name is required.'),
  owner_name: z.string().optional(),
  owner_mobile: z.string().optional(),
});


// --- Generic Toggle Function ---
async function toggleActiveStatus(tableName: string, idColumn: string, id: number): Promise<FormState> {
    // Whitelist valid table -> idColumn mappings to avoid SQL injection via identifiers
    const allowed: Record<string, string> = {
        landmarks: 'landmark_id',
        villages: 'village_id',
        seeds: 'seed_id',
        shipment_companies: 'company_id',
        destination_companies: 'dest_company_id',
    };

    if (!(tableName in allowed) || allowed[tableName] !== idColumn) {
        return { message: 'Invalid table or column specified.', success: false };
    }

    try {
        // Use a constructed query string for identifiers (validated above) and parameterize values
        const queryText = `UPDATE ${tableName} SET is_active = NOT is_active WHERE ${idColumn} = $1`;
        await sql.query(queryText, [id]);
        revalidatePath(SETTINGS_PATH);
        return { message: 'Status updated successfully.', success: true };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Database error: Could not update status.', success: false };
    }
}


// --- Landmark Actions ---
export async function addLandmark(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LandmarkSchema.safeParse({ landmark_name: formData.get('landmark_name') });
  if (!validatedFields.success) return { message: 'Validation Error.', success: false, error: validatedFields.error.flatten().fieldErrors.landmark_name?.[0] };
  try {
    await sql`INSERT INTO landmarks (landmark_name) VALUES (${validatedFields.data.landmark_name})`;
    revalidatePath(SETTINGS_PATH);
    return { message: 'Landmark added.', success: true };
  } catch (e: any) {
    return { message: 'Database Error: Failed to add landmark.', success: false, error: e.message };
  }
}
export async function toggleLandmark(id: number) { return toggleActiveStatus('landmarks', 'landmark_id', id); }


// --- Village Actions ---
export async function addVillage(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = VillageSchema.safeParse({ village_name: formData.get('village_name') });
  if (!validatedFields.success) return { message: 'Validation Error.', success: false, error: validatedFields.error.flatten().fieldErrors.village_name?.[0] };
  try {
    await sql`INSERT INTO villages (village_name) VALUES (${validatedFields.data.village_name})`;
    revalidatePath(SETTINGS_PATH);
    return { message: 'Village added.', success: true };
  } catch (e: any) {
    return { message: 'Database Error: Failed to add village.', success: false, error: e.message };
  }
}
export async function toggleVillage(id: number) { return toggleActiveStatus('villages', 'village_id', id); }


// --- Seed Variety Actions ---
export async function addSeedVariety(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SeedVarietySchema.safeParse({
    variety_name: formData.get('variety_name'),
    crop_type: formData.get('crop_type'),
    company_name: formData.get('company_name'),
    is_default: formData.get('is_default') === 'on',
  });
  if (!validatedFields.success) return { message: 'Validation Error.', success: false, error: 'All fields are required and must be at least 3 characters.' };
  try {
    const { variety_name, crop_type, company_name, is_default } = validatedFields.data;
    await sql`INSERT INTO seeds (variety_name, crop_type, company_name, is_default) VALUES (${variety_name}, ${crop_type}, ${company_name}, ${is_default})`;
    revalidatePath(SETTINGS_PATH);
    return { message: 'Seed Variety added.', success: true };
  } catch (e: any) {
    return { message: 'Database Error: Failed to add seed variety.', success: false, error: e.message };
  }
}
export async function toggleSeedVariety(id: number) { return toggleActiveStatus('seeds', 'seed_id', id); }


// --- Shipment Company Actions ---
export async function addShipmentCompany(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = ShipCompanySchema.safeParse({
    company_name: formData.get('company_name'),
    owner_name: formData.get('owner_name'),
    owner_mobile: formData.get('owner_mobile'),
  });
  if (!validatedFields.success) return { message: 'Validation Error.', success: false, error: 'Company name is required.' };
  try {
    const { company_name, owner_name, owner_mobile } = validatedFields.data;
    await sql`INSERT INTO shipment_companies (company_name, owner_name, owner_mobile) VALUES (${company_name}, ${owner_name}, ${owner_mobile})`;
    revalidatePath(SETTINGS_PATH);
    return { message: 'Shipment Company added.', success: true };
  } catch (e: any) {
    return { message: 'Database Error: Failed to add company.', success: false, error: e.message };
  }
}
export async function toggleShipmentCompany(id: number) { return toggleActiveStatus('shipment_companies', 'company_id', id); }


// --- Destination Company Actions ---
export async function addDestinationCompany(prevState: FormState, formData: FormData): Promise<FormState> {
  // *** FIX: Read the correct field name generated by MasterDataSection ***
  const companyNameFromForm = formData.get('destination_companies_name');

  // *** FIX: Pass the value read from the form to the schema under the expected key ***
  const validatedFields = DestCompanySchema.safeParse({ company_name: companyNameFromForm });

  if (!validatedFields.success) {
    // Return the specific validation error if available
    return { message: 'Validation Error.', success: false, error: validatedFields.error.flatten().fieldErrors.company_name?.[0] };
  }
  try {
    // Use the validated data (validatedFields.data.company_name) for the SQL query
    await sql`INSERT INTO destination_companies (company_name) VALUES (${validatedFields.data.company_name})`;
    revalidatePath(SETTINGS_PATH);
    return { message: 'Destination Company added.', success: true };
  } catch (e: any) {
    // Handle potential database errors (e.g., duplicate entry)
    return { message: 'Database Error: Failed to add company.', success: false, error: e.message };
  }
}
export async function toggleDestinationCompany(id: number) { return toggleActiveStatus('destination_companies', 'dest_company_id', id); }