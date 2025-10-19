// app/admin/settings/data.ts
import { sql } from '@vercel/postgres';

// Define types for the master data we will fetch
export type MasterDataItem = {
    id: number;
    name: string;
    is_active: boolean;
};

export type SeedVarietySetting = {
    id: number;
    name: string;
    crop_type: string;
    company_name: string;
    is_active: boolean;
};

export type ShipmentCompanySetting = {
    id: number;
    name: string;
    owner_name: string;
    owner_mobile: string;
    is_active: boolean;
}

// Fetch the current mode of the employee app
export async function getEmployeeMode(): Promise<'Growing' | 'Harvesting'> {
    const { rows } = await sql`
        SELECT setting_value FROM app_settings WHERE setting_key = 'current_employee_mode' LIMIT 1;
    `;
    return rows[0]?.setting_value as 'Growing' | 'Harvesting' || 'Growing';
}

// Fetch all landmarks
export async function getSettingsLandmarks(): Promise<MasterDataItem[]> {
    const { rows } = await sql`SELECT landmark_id as id, landmark_name as name, is_active FROM landmarks ORDER BY landmark_name;`;
    return rows as MasterDataItem[];
}

// Fetch all villages
export async function getSettingsVillages(): Promise<MasterDataItem[]> {
    const { rows } = await sql`SELECT village_id as id, village_name as name, is_active FROM villages ORDER BY village_name;`;
    return rows as MasterDataItem[];
}

// Fetch all destination companies
export async function getSettingsDestinationCompanies(): Promise<MasterDataItem[]> {
    const { rows } = await sql`SELECT dest_company_id as id, company_name as name, is_active FROM destination_companies ORDER BY company_name;`;
    return rows as MasterDataItem[];
}

// Fetch all seed varieties
export async function getSettingsSeedVarieties(): Promise<SeedVarietySetting[]> {
    const { rows } = await sql`
        SELECT seed_id as id, variety_name as name, crop_type, company_name, is_active 
        FROM seeds 
        ORDER BY variety_name;
    `;
    return rows as SeedVarietySetting[];
}

// Fetch all shipment companies
export async function getSettingsShipmentCompanies(): Promise<ShipmentCompanySetting[]> {
    const { rows } = await sql`
        SELECT company_id as id, company_name as name, owner_name, owner_mobile, is_active 
        FROM shipment_companies 
        ORDER BY company_name;
    `;
    return rows as ShipmentCompanySetting[];
}