// lib/growing-data.ts
import { sql } from '@vercel/postgres';
//
// THIS IS THE MOST IMPORTANT LINE:
// We are IMPORTING the type from the definitions file.
//
import { CropCycleForEmployee } from './definitions';

/**
 * Fetches a list of active crop cycles for the current year.
 */
export async function getAssignedCycles(year: number): Promise<CropCycleForEmployee[]> {
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
            WHERE cc.crop_cycle_year = ${year}
            ORDER BY f.name;
        `;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch assigned cycles.');
    }
}

/**
 * Searches all crop cycles in a given year based on a farmer's name or mobile number.
 */
export async function searchAllCycles(query: string, year: number): Promise<CropCycleForEmployee[]> {
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
            WHERE 
                (f.name ILIKE ${'%' + query + '%'} OR f.mobile_number ILIKE ${'%' + query + '%'})
                AND cc.crop_cycle_year = ${year}
            ORDER BY f.name;
        `;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to search all cycles.');
    }
}

/**
 * Fetches specific details for a single crop cycle needed for the visit form.
 */
export async function getCycleForVisit(cycleId: number): Promise<(CropCycleForEmployee & { farm_id: number; first_visit_date: string | null }) | null> {
    try {
        const data = await sql`
            SELECT 
                cc.crop_cycle_id,
                cc.farm_id,
                f.name as farmer_name,
                (SELECT visit_date::text FROM field_visits WHERE crop_cycle_id = ${cycleId} AND visit_number = 1 ORDER BY visit_date DESC LIMIT 1) as first_visit_date
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            WHERE cc.crop_cycle_id = ${cycleId};
        `;
        
        if (data.rows.length === 0) {
            return null;
        }
        return data.rows[0] as (CropCycleForEmployee & { farm_id: number; first_visit_date: string | null });

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch cycle details for visit form.');
    }
}

/**
 * Returns a hardcoded list of fertilizer options for the visit form.
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
 * Returns a hardcoded list of disease options for the visit form.
 */
export async function getDiseaseOptions(): Promise<{ id: string; name: string; }[]> {
    return [
        { id: 'pest', name: 'Pest (ઇયળ)' },
        { id: 'rust', name: 'Rust (ગરો)' },
        { id: 'wilting', name: 'Wilting (સુકારો)' },
    ];
}

export type { CropCycleForEmployee };
