// lib/growing-data.ts
import { sql } from '@vercel/postgres';
import { CropCycleForEmployee, CycleForVisit, FarmerByLandmark } from './definitions';

// Define a type for the filters for the new universal function
export type CycleFilters = {
  year?: number;
  query?: string;
  landmarkId?: number;
  villageId?: number;
  seedId?: number;
  excludeCycleId?: number;
};

/**
 * NEW UNIVERSAL FUNCTION: Fetches a list of crop cycles based on a variety of filters.
 */
export async function getCycles(filters: CycleFilters): Promise<CropCycleForEmployee[]> {
    const { year = new Date().getFullYear(), query, landmarkId, excludeCycleId } = filters;

    // Base query
    let queryStr = `
        SELECT
            cc.crop_cycle_id,
            f.name as farmer_name,
            f.mobile_number,
            v.village_name as village,
            fa.location_name as farm_location,
            s.variety_name as seed_variety,
            cc.status,
            (SELECT COUNT(*) FROM field_visits fv WHERE fv.crop_cycle_id = cc.crop_cycle_id) as visit_count
        FROM crop_cycles cc
        JOIN farmers f ON cc.farmer_id = f.farmer_id
        JOIN farms fa ON cc.farm_id = fa.farm_id
        JOIN seeds s ON cc.seed_id = s.seed_id
        JOIN villages v ON fa.village_id = v.village_id
        JOIN landmarks l ON fa.landmark_id = l.landmark_id
    `;

    const params: any[] = [year];
    let whereClauses: string[] = [`cc.crop_cycle_year = $1`];
    let paramIndex = 2;

    if (query) {
        whereClauses.push(`(f.name ILIKE $${paramIndex} OR f.mobile_number ILIKE $${paramIndex})`);
        params.push(`%${query}%`);
        paramIndex++;
    }
    if (landmarkId) {
        whereClauses.push(`fa.landmark_id = $${paramIndex}`);
        params.push(landmarkId);
        paramIndex++;
    }
    if (excludeCycleId) {
        whereClauses.push(`cc.crop_cycle_id != $${paramIndex}`);
        params.push(excludeCycleId);
        paramIndex++;
    }

    if (whereClauses.length > 0) {
        queryStr += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryStr += ` ORDER BY f.name;`;

    try {
        const { rows } = await sql.query(queryStr, params);
        return rows as CropCycleForEmployee[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch cycles.');
    }
}


/**
 * Fetches a list of active crop cycles for the current year.
 */
export async function getAssignedCycles(year: number): Promise<CropCycleForEmployee[]> {
    try {
        const data = await sql<CropCycleForEmployee>`
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                v.village_name as village,
                fa.location_name as farm_location,
                s.variety_name as seed_variety,
                cc.status,
                (SELECT COUNT(*) FROM field_visits fv WHERE fv.crop_cycle_id = cc.crop_cycle_id) as visit_count
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            JOIN villages v ON fa.village_id = v.village_id
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
                v.village_name as village,
                fa.location_name as farm_location,
                s.variety_name as seed_variety,
                cc.status,
                (SELECT COUNT(*) FROM field_visits fv WHERE fv.crop_cycle_id = cc.crop_cycle_id) as visit_count
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            JOIN villages v ON fa.village_id = v.village_id
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
export async function getCycleForVisit(cycleId: number): Promise<CycleForVisit | null> {
    try {
        const data = await sql`
            SELECT
                cc.crop_cycle_id,
                cc.farm_id,
                f.name as farmer_name,
                (SELECT visit_date::text FROM field_visits WHERE crop_cycle_id = ${cycleId} AND visit_number = 1 ORDER BY visit_date DESC LIMIT 1) as first_visit_date,
                cc.sowing_date::text,
                fa.location_name as farm_location,
                s.variety_name as seed_variety,
                l.landmark_id,
                l.landmark_name
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            JOIN landmarks l ON fa.landmark_id = l.landmark_id
            WHERE cc.crop_cycle_id = ${cycleId};
        `;

        if (data.rows.length === 0) {
            return null;
        }
        return data.rows[0] as CycleForVisit;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch cycle details for visit form.');
    }
}


/**
 * NEW: Fetches a list of farmers who have farms with the same landmark.
 */
export async function getCyclesByLandmark(landmarkId: number, currentCycleId: number): Promise<FarmerByLandmark[]> {
  try {
    const data = await sql<FarmerByLandmark>`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        f.mobile_number,
        s.variety_name as seed_variety,
        fa.location_name as farm_location
      FROM crop_cycles cc
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE fa.landmark_id = ${landmarkId}
        AND cc.crop_cycle_id != ${currentCycleId}
      ORDER BY f.name;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cycles by landmark.');
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