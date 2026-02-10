// app/admin/settings/data.ts
import { sql } from '@vercel/postgres';

export type MasterDataItem = {
    id: number;
    name: string;
    is_active: boolean;
};

// Updated Type for Seeds to include Company Name
export type SeedVarietySetting = {
    id: number;
    name: string;
    crop_type: string;
    company_id: number;     
    company_name: string;   // Fetched via JOIN
    color_code: string;
    is_active: boolean;
};

export type ShipmentCompanySetting = {
    id: number;
    name: string;
    owner_name: string;
    owner_mobile: string;
    is_active: boolean;
}

export type EmployeeSetting = {
    id: number;
    name: string;
    mobile: string;
    role: string;
    assigned_seeds: number[]; 
    is_active: boolean;
};

// --- FETCHERS ---

export async function getEmployeeMode(): Promise<'Growing' | 'Harvesting'> {
    try {
        const { rows } = await sql`SELECT setting_value FROM app_settings WHERE setting_key = 'current_employee_mode' LIMIT 1;`;
        return rows[0]?.setting_value as 'Growing' | 'Harvesting' || 'Growing';
    } catch (e) { return 'Growing'; }
}

export async function getAdminDefaultSeason(): Promise<'Sowing' | 'Growing' | 'Harvesting'> {
    try {
        const { rows } = await sql`SELECT setting_value FROM app_settings WHERE setting_key = 'admin_default_season' LIMIT 1;`;
        const val = rows[0]?.setting_value;
        if (val === 'Sowing' || val === 'Growing' || val === 'Harvesting') return val;
        return 'Sowing';
    } catch (e) { return 'Sowing'; }
}

export async function getSettingsLandmarks(): Promise<MasterDataItem[]> {
    const { rows } = await sql`SELECT landmark_id as id, landmark_name as name, is_active FROM landmarks ORDER BY landmark_name;`;
    return rows as MasterDataItem[];
}

export async function getSettingsVillages(): Promise<MasterDataItem[]> {
    const { rows } = await sql`SELECT village_id as id, village_name as name, is_active FROM villages ORDER BY village_name;`;
    return rows as MasterDataItem[];
}

export async function getSettingsDestinationCompanies(): Promise<MasterDataItem[]> {
    const { rows } = await sql`SELECT dest_company_id as id, company_name as name, is_active FROM destination_companies ORDER BY company_name;`;
    return rows as MasterDataItem[];
}

// *** UPDATED: JOIN to fetch company name for display ***
export async function getSettingsSeedVarieties(): Promise<SeedVarietySetting[]> {
    const { rows } = await sql`
        SELECT 
            s.seed_id as id, 
            s.variety_name as name, 
            s.crop_type, 
            s.dest_company_id as company_id,
            d.company_name, 
            s.color_code, 
            s.is_active 
        FROM seeds s
        LEFT JOIN destination_companies d ON s.dest_company_id = d.dest_company_id
        ORDER BY s.variety_name;
    `;
    return rows.map(r => ({ ...r, color_code: r.color_code || '#2563eb' })) as SeedVarietySetting[];
}

export async function getSettingsShipmentCompanies(): Promise<ShipmentCompanySetting[]> {
    const { rows } = await sql`
        SELECT company_id as id, company_name as name, owner_name, owner_mobile, is_active 
        FROM shipment_companies 
        ORDER BY company_name;
    `;
    return rows as ShipmentCompanySetting[];
}

export async function getSettingsEmployees(): Promise<EmployeeSetting[]> {
    try {
        const usersResult = await sql`
            SELECT user_id as id, name, mobile_number as mobile, role 
            FROM users 
            WHERE role != 'admin' 
            ORDER BY name;
        `;

        const assignmentsResult = await sql`SELECT * FROM employee_assignments`;
        
        return usersResult.rows.map(user => {
            const userAssignments = assignmentsResult.rows
                .filter(a => a.user_id === user.id)
                .map(a => a.seed_id);
            
            return { ...user, assigned_seeds: userAssignments };
        }) as EmployeeSetting[];
    } catch (e) {
        console.error("Failed to fetch employees", e);
        return [];
    }
}