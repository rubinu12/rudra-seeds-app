// app/admin/settings/data.ts
import { sql } from '@vercel/postgres';

export type MasterDataItem = {
    id: number;
    name: string;
    is_active: boolean;
};

export type SeedVarietySetting = {
    id: number;
    name: string;
    crop_type: string;
    company_id: number;     
    company_name: string;
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

// --- INTERFACES FOR DB ROWS (Prevents 'any') ---
interface DbAssignmentRow {
    user_id: number;
    seed_id: number;
}

interface DbUserRow {
    id: number;
    name: string;
    mobile: string;
    role: string;
    is_active: boolean;
}

interface DbSeedRow {
    id: number;
    name: string;
    crop_type: string;
    company_id: number;
    company_name: string;
    color_code: string | null;
    is_active: boolean;
}

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
    
    // Explicitly cast rows to DbSeedRow to avoid implicit any map
    const seeds = rows as unknown as DbSeedRow[];
    
    return seeds.map(r => ({ 
        ...r, 
        color_code: r.color_code || '#2563eb' 
    }));
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
            SELECT user_id as id, name, mobile_number as mobile, role, is_active 
            FROM users 
            WHERE role != 'admin' 
            ORDER BY name;
        `;

        const assignmentsResult = await sql`SELECT user_id, seed_id FROM employee_assignments`;
        
        const users = usersResult.rows as unknown as DbUserRow[];
        const assignments = assignmentsResult.rows as unknown as DbAssignmentRow[];
        
        return users.map(user => {
            const userAssignments = assignments
                .filter(a => a.user_id === user.id)
                .map(a => a.seed_id);
            
            return { ...user, assigned_seeds: userAssignments };
        });
    } catch (e) {
        console.error("Failed to fetch employees", e);
        return [];
    }
}