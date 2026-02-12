// app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sql } from '@vercel/postgres';

export type FormState = {
    message: string;
    success: boolean;
    error?: string;
};

// --- 1. GLOBAL SETTINGS ---

export async function updateEmployeeMode(mode: 'Growing' | 'Harvesting') {
    try {
        await sql`UPDATE app_settings SET setting_value = ${mode} WHERE setting_key = 'current_employee_mode'`;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update mode' };
    }
}

export async function updateAdminDefaultSeason(season: 'Sowing' | 'Growing' | 'Harvesting') {
    try {
        await sql`UPDATE app_settings SET setting_value = ${season} WHERE setting_key = 'admin_default_season'`;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to update season' };
    }
}

// --- 2. EMPLOYEE MANAGEMENT ---

const EmployeeSchema = z.object({
    name: z.string().min(2),
    mobile: z.string().min(10),
    password: z.string().min(4),
});

export async function addEmployee(_prevState: FormState, formData: FormData): Promise<FormState> {
    const rawData = {
        name: formData.get('name'),
        mobile: formData.get('mobile'),
        password: formData.get('password'),
    };

    const validated = EmployeeSchema.safeParse(rawData);
    if (!validated.success) {
        return { message: 'Invalid data', success: false, error: 'Check name/mobile requirements' };
    }

    try {
        await sql`
            INSERT INTO users (name, mobile_number, password_hash, role, is_active)
            VALUES (${validated.data.name}, ${validated.data.mobile}, ${validated.data.password}, 'employee', true)
        `;
        revalidatePath('/admin/settings');
        return { message: 'Employee added', success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Database Error', success: false, error: 'Mobile number might already exist' };
    }
}

export async function toggleEmployee(id: string | number) {
    try {
        await sql`UPDATE users SET is_active = NOT is_active WHERE user_id = ${id}`;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function updateEmployeeAssignments(employeeId: string | number, seedIds: number[]) {
    try {
        // 1. Remove old assignments
        await sql`DELETE FROM employee_assignments WHERE user_id = ${employeeId}`;
        
        // 2. Add new assignments
        if (seedIds.length > 0) {
            for (const seedId of seedIds) {
                 await sql`INSERT INTO employee_assignments (user_id, seed_id) VALUES (${employeeId}, ${seedId})`;
            }
        }
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

// --- 3. MASTER DATA (Villages & Landmarks) ---

export async function addVillage(_prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('village_name') as string;
    if (!name) return { message: 'Name required', success: false };

    try {
        await sql`INSERT INTO villages (village_name, is_active) VALUES (${name}, true)`;
        revalidatePath('/admin/settings');
        return { message: 'Village added', success: true };
    } catch (e) {
        return { message: 'Error', success: false, error: 'Failed to add village' };
    }
}

export async function toggleVillage(id: number) {
    await sql`UPDATE villages SET is_active = NOT is_active WHERE village_id = ${id}`;
    revalidatePath('/admin/settings');
}

export async function addLandmark(_prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('landmark_name') as string;
    if (!name) return { message: 'Name required', success: false };

    try {
        await sql`INSERT INTO landmarks (landmark_name, is_active) VALUES (${name}, true)`;
        revalidatePath('/admin/settings');
        return { message: 'Landmark added', success: true };
    } catch (e) {
        return { message: 'Error', success: false, error: 'Failed to add landmark' };
    }
}

export async function toggleLandmark(id: number) {
    await sql`UPDATE landmarks SET is_active = NOT is_active WHERE landmark_id = ${id}`;
    revalidatePath('/admin/settings');
}

// --- 4. SEED VARIETIES (Catalog) ---

const SeedSchema = z.object({
    name: z.string().min(1),
    crop_type: z.string().min(1),
    color_code: z.string().optional(),
    company_id: z.string().min(1, "Company selection is required"),
});

export async function addSeedVariety(_prevState: FormState, formData: FormData): Promise<FormState> {
    const rawData = {
        name: formData.get('variety_name'),
        crop_type: formData.get('crop_type'),
        color_code: formData.get('color_code') || '#2563eb',
        company_id: formData.get('dest_company_id'),
    };

    const validated = SeedSchema.safeParse(rawData);
    if (!validated.success) {
        return { message: 'Validation Failed', success: false, error: validated.error.issues[0].message };
    }

    try {
        await sql`
            INSERT INTO seeds (variety_name, crop_type, color_code, dest_company_id, is_active)
            VALUES (${validated.data.name}, ${validated.data.crop_type}, ${validated.data.color_code}, ${validated.data.company_id}, true)
        `;
        revalidatePath('/admin/settings');
        return { message: 'Seed added', success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Database Error', success: false, error: 'Check seeds table definition' };
    }
}

export async function toggleSeedVariety(id: number) {
    await sql`UPDATE seeds SET is_active = NOT is_active WHERE seed_id = ${id}`;
    revalidatePath('/admin/settings');
}

export async function updateSeedColor(id: number, color: string) {
    await sql`UPDATE seeds SET color_code = ${color} WHERE seed_id = ${id}`;
    revalidatePath('/admin/settings');
}

export async function updateSeedVarietyDetails(
    id: number, 
    editData: { 
        variety_name: string; 
        crop_type: string; 
        dest_company_id: string | number; 
        color_code: string; 
    }
) {
    try {
        await sql`
            UPDATE seeds
            SET 
                variety_name = ${editData.variety_name}, 
                crop_type = ${editData.crop_type}, 
                dest_company_id = ${editData.dest_company_id}, 
                color_code = ${editData.color_code}
            WHERE seed_id = ${id}
        `;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error('Update failed:', error);
        return { success: false, error: 'Failed to update details' };
    }
}

// --- 5. COMPANIES (Partners & Logistics) ---

export async function addDestinationCompany(_prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('company_name') as string;

    if (!name) return { message: 'Name required', success: false };

    try {
        await sql`
            INSERT INTO destination_companies (company_name, is_active) 
            VALUES (${name}, true)
        `;
        revalidatePath('/admin/settings');
        return { message: 'Partner added', success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Error', success: false, error: 'Failed to add company' };
    }
}

export async function toggleDestinationCompany(id: number | string) {
    await sql`UPDATE destination_companies SET is_active = NOT is_active WHERE dest_company_id = ${id}`;
    revalidatePath('/admin/settings');
}

export async function addShipmentCompany(_prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('company_name') as string;
    const ownerName = formData.get('owner_name') as string;
    const ownerMobile = formData.get('owner_mobile') as string;

    if (!name) return { message: 'Name required', success: false };

    try {
        await sql`
            INSERT INTO shipment_companies (company_name, owner_name, owner_mobile, is_active) 
            VALUES (${name}, ${ownerName}, ${ownerMobile}, true)
        `;
        revalidatePath('/admin/settings');
        return { message: 'Transporter added', success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Error', success: false, error: 'Failed to add transporter' };
    }
}

export async function toggleShipmentCompany(id: number | string) {
    await sql`UPDATE shipment_companies SET is_active = NOT is_active WHERE company_id = ${id}`;
    revalidatePath('/admin/settings');
}