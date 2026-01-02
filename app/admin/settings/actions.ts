// app/admin/settings/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export type FormState = {
    message: string;
    success: boolean;
    error?: string;
};

// --- System Settings ---

export async function updateEmployeeMode(mode: string): Promise<FormState> {
    try {
        await sql`
            INSERT INTO app_settings (setting_key, setting_value)
            VALUES ('current_employee_mode', ${mode})
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = ${mode};
        `;
        revalidatePath('/admin/settings');
        return { message: 'Employee App Mode Updated', success: true };
    } catch (e) { return { message: 'Failed to update', success: false, error: String(e) }; }
}

export async function updateAdminDefaultSeason(season: string): Promise<FormState> {
    try {
        await sql`
            INSERT INTO app_settings (setting_key, setting_value)
            VALUES ('admin_default_season', ${season})
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = ${season};
        `;
        // Revalidate both dashboard (to apply change) and settings (to show active state)
        revalidatePath('/admin/dashboard'); 
        revalidatePath('/admin/settings');
        return { message: 'Admin Default Season Updated', success: true };
    } catch (e) { return { message: 'Failed to update', success: false, error: String(e) }; }
}

// --- Master Data Actions ---

export async function addVillage(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('village_name') as string;
    if (!name) return { message: 'Name required', success: false };
    try {
        await sql`INSERT INTO villages (village_name, is_active) VALUES (${name}, TRUE)`;
        revalidatePath('/admin/settings');
        return { message: 'Added', success: true };
    } catch (e) { return { message: 'Error', success: false, error: String(e) }; }
}

export async function toggleVillage(id: number): Promise<FormState> {
    try {
        await sql`UPDATE villages SET is_active = NOT is_active WHERE village_id = ${id}`;
        revalidatePath('/admin/settings');
        return { message: 'Toggled', success: true };
    } catch (e) { return { message: 'Error', success: false }; }
}

export async function addLandmark(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('landmark_name') as string;
    if (!name) return { message: 'Name required', success: false };
    try {
        await sql`INSERT INTO landmarks (landmark_name, is_active) VALUES (${name}, TRUE)`;
        revalidatePath('/admin/settings');
        return { message: 'Added', success: true };
    } catch (e) { return { message: 'Error', success: false, error: String(e) }; }
}

export async function toggleLandmark(id: number): Promise<FormState> {
    try {
        await sql`UPDATE landmarks SET is_active = NOT is_active WHERE landmark_id = ${id}`;
        revalidatePath('/admin/settings');
        return { message: 'Toggled', success: true };
    } catch (e) { return { message: 'Error', success: false }; }
}

export async function addDestinationCompany(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('company_name') as string;
    if (!name) return { message: 'Name required', success: false };
    try {
        await sql`INSERT INTO destination_companies (company_name, is_active) VALUES (${name}, TRUE)`;
        revalidatePath('/admin/settings');
        return { message: 'Added', success: true };
    } catch (e) { return { message: 'Error', success: false, error: String(e) }; }
}

export async function toggleDestinationCompany(id: number): Promise<FormState> {
    try {
        await sql`UPDATE destination_companies SET is_active = NOT is_active WHERE dest_company_id = ${id}`;
        revalidatePath('/admin/settings');
        return { message: 'Toggled', success: true };
    } catch (e) { return { message: 'Error', success: false }; }
}

// --- Seed Varieties (Updated with Color Logic) ---

export async function addSeedVariety(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('variety_name') as string;
    const crop = formData.get('crop_type') as string;
    const company = formData.get('company_name') as string;
    const color = formData.get('color_code') as string || '#2563eb'; // Default Blue if missing

    if (!name || !crop || !company) return { message: 'Missing fields', success: false };
    
    try {
        // We added color_code to this query
        await sql`
            INSERT INTO seeds (variety_name, crop_type, company_name, color_code, is_active) 
            VALUES (${name}, ${crop}, ${company}, ${color}, TRUE)
        `;
        revalidatePath('/admin/settings');
        return { message: 'Added', success: true };
    } catch (e) { return { message: 'Error', success: false, error: String(e) }; }
}

export async function toggleSeedVariety(id: number): Promise<FormState> {
    try {
        await sql`UPDATE seeds SET is_active = NOT is_active WHERE seed_id = ${id}`;
        revalidatePath('/admin/settings');
        return { message: 'Toggled', success: true };
    } catch (e) { return { message: 'Error', success: false }; }
}

// *** NEW: Action to update just the color of a seed ***
export async function updateSeedColor(seedId: number, color: string): Promise<FormState> {
    try {
        await sql`UPDATE seeds SET color_code = ${color} WHERE seed_id = ${seedId}`;
        revalidatePath('/admin/settings');
        return { message: 'Color Updated', success: true };
    } catch (e) { return { message: 'Error updating color', success: false }; }
}

// --- Shipment Companies ---

export async function addShipmentCompany(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('company_name') as string;
    const owner = formData.get('owner_name') as string;
    const mobile = formData.get('owner_mobile') as string;
    
    if (!name) return { message: 'Name required', success: false };
    
    try {
        await sql`INSERT INTO shipment_companies (company_name, owner_name, owner_mobile, is_active) VALUES (${name}, ${owner}, ${mobile}, TRUE)`;
        revalidatePath('/admin/settings');
        return { message: 'Added', success: true };
    } catch (e) { return { message: 'Error', success: false, error: String(e) }; }
}

export async function toggleShipmentCompany(id: number): Promise<FormState> {
    try {
        await sql`UPDATE shipment_companies SET is_active = NOT is_active WHERE company_id = ${id}`;
        revalidatePath('/admin/settings');
        return { message: 'Toggled', success: true };
    } catch (e) { return { message: 'Error', success: false }; }
}

// --- Employee Management (NEW SECTION) ---

export async function addEmployee(prevState: FormState, formData: FormData): Promise<FormState> {
    const name = formData.get('name') as string;
    const mobile = formData.get('mobile') as string;
    const password = formData.get('password') as string; // Ideally hash this
    
    if (!name || !mobile || !password) return { message: 'Missing fields', success: false };
    
    try {
        await sql`
            INSERT INTO users (name, mobile_number, password, role, is_active)
            VALUES (${name}, ${mobile}, ${password}, 'employee', TRUE)
        `;
        revalidatePath('/admin/settings');
        return { message: 'Employee Added', success: true };
    } catch (e) { return { message: 'Mobile likely exists', success: false, error: String(e) }; }
}

export async function toggleEmployee(id: number): Promise<FormState> {
    try {
        await sql`UPDATE users SET is_active = NOT is_active WHERE user_id = ${id}`;
        revalidatePath('/admin/settings');
        return { message: 'Status Updated', success: true };
    } catch (e) { return { message: 'Error', success: false }; }
}

export async function updateEmployeeAssignments(userId: number, seedIds: number[]): Promise<FormState> {
    try {
        // 1. Clear existing assignments for this user
        await sql`DELETE FROM employee_assignments WHERE user_id = ${userId}`;
        
        // 2. Add new assignments (batch insert)
        if (seedIds.length > 0) {
            // We loop here for simplicity with @vercel/postgres template literals, 
            // but a single query with values list is more efficient in raw PG.
            for (const seedId of seedIds) {
                await sql`
                    INSERT INTO employee_assignments (user_id, seed_id) 
                    VALUES (${userId}, ${seedId})
                    ON CONFLICT DO NOTHING;
                `;
            }
        }
        
        revalidatePath('/admin/settings');
        return { message: 'Assignments Updated', success: true };
    } catch (e) { return { message: 'Error saving assignments', success: false, error: String(e) }; }
}