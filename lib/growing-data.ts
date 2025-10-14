// lib/growing-data.ts
import { sql } from '@vercel/postgres';
import { FarmerDetails, Farm, Landmark } from './definitions'; // Re-using existing definitions

// Define new types specific to the "Growing" phase
export type CropCycleForEmployee = {
  crop_cycle_id: number;
  farmer_name: string;
  village: string;
  farm_location: string;
  seed_variety: string;
  visit_count: number; // To track if it's the 1st or 2nd visit
};

export type VisitDetails = {
    visit_id: number;
    crop_cycle_id: number;
    employee_id: number;
    visit_date: string;
    rouging_percentage: number;
    crop_condition: string;
    disease_data: any; // Using 'any' for now, will be a JSON object
    irrigation_count: number;
    fertilizer_data: any; // Using 'any' for now, will be a JSON object
    image_url: string;
    visit_number: number;
    next_visit_days: number;
    farmer_cooperation: string;
    remarks: string;
};


// --- DATA FETCHING FUNCTIONS ---

/**
 * Fetches a list of active crop cycles. 
 * This can be adapted later to fetch cycles for a specific employee.
 */
export async function getAssignedCycles(): Promise<CropCycleForEmployee[]> {
    try {
        const data = await sql<CropCycleForEmployee>`
            SELECT 
                cc.crop_cycle_id,
                f.name as farmer_name,
                f.village,
                fa.location_name as farm_location,
                s.variety_name as seed_variety,
                (SELECT COUNT(*) FROM field_visits fv WHERE fv.crop_cycle_id = cc.crop_cycle_id) as visit_count
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Growing' -- Placeholder status for active cycles
            ORDER BY f.name;
        `;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch assigned cycles.');
    }
}

/**
 * Returns the hardcoded list of fertilizer options.
 */
export async function getFertilizerOptions(): Promise<{ id: string; name: string; }[]> {
    return [
        { id: 'dap', name: 'DAP (ડીએપી)' },
        { id: 'npk', name: 'NPK (એનપીકે)' },
        { id: 'urea', name: 'Urea (યુરિયા)' },
        { id: 'zinc', name: 'Zinc (ઝીંક)' },
        { id: 'potash', name: 'Potash (પોટાશ)' },
        { id: 'sulphur', name: 'Sulphur (સલ્ફર)' },
        { id: 'other', name: 'Other (અન્ય)' },
    ];
}

/**
 * Returns the hardcoded list of disease options.
 */
export async function getDiseaseOptions(): Promise<{ id: string; name: string; }[]> {
    return [
        { id: 'pest', name: 'Pest (ઇયળ)' },
        { id: 'rust', name: 'Rust (ગરો )' },
        { id: 'wilting', name: 'Wilting (સુકારો)' },
    ];
}