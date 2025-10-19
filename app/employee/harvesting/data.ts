// app/employee/harvesting/data.ts
"use server";

import { sql } from '@vercel/postgres';
import { CropCycleForEmployee } from '@/lib/definitions'; // We can reuse this type for our lists

/**
 * Fetches crop cycles that have been harvested but not yet sampled.
 * This is the "Pending Sample Collection" list for employees.
 */
export async function getCyclesToSample(): Promise<CropCycleForEmployee[]> {
  try {
    const data = await sql<CropCycleForEmployee>`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        v.village_name as village,
        fa.location_name as farm_location,
        s.variety_name as seed_variety,
        cc.status
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN villages v ON fa.village_id = v.village_id
      WHERE cc.status = 'Harvested'
      ORDER BY cc.harvesting_date ASC;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cycles pending sampling.');
  }
}

/**
 * Fetches crop cycles that have been priced but not yet weighed.
 * This is the "Pending Weighing" list for employees.
 */
export async function getCyclesToWeigh(): Promise<CropCycleForEmployee[]> {
  try {
    const data = await sql<CropCycleForEmployee>`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        v.village_name as village,
        fa.location_name as farm_location,
        s.variety_name as seed_variety,
        cc.status
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN villages v ON fa.village_id = v.village_id
      WHERE cc.status = 'Priced'
      ORDER BY cc.sowing_date ASC;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cycles pending weighing.');
  }
}