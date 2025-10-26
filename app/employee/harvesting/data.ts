// app/employee/harvesting/data.ts
"use server";

import { sql } from '@vercel/postgres';
// Import the expanded type definition
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';

/**
 * Fetches crop cycles that are either 'Harvested' or 'Sample Collected'.
 * Includes fields needed for consistency, though not all used directly in sampling lists.
 */
export async function getCyclesToSample(): Promise<CropCycleForEmployeeWeighing[]> {
  try {
    const data = await sql<CropCycleForEmployeeWeighing>`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        f.mobile_number,
        v.village_name as village,
        fa.location_name as farm_location,
        l.landmark_name,
        s.variety_name as seed_variety,
        cc.status,
        cc.goods_collection_method,
        cc.seed_bags_purchased,
        cc.seed_bags_returned,
        cc.lot_no,
        cc.quantity_in_bags,       -- Added for context if needed elsewhere
        cc.bags_remaining_to_load  -- Added for context if needed elsewhere
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN villages v ON fa.village_id = v.village_id
      LEFT JOIN landmarks l ON fa.landmark_id = l.landmark_id
      WHERE cc.status = 'Harvested' OR cc.status = 'Sample Collected'
      ORDER BY
        CASE cc.status
          WHEN 'Harvested' THEN 1
          WHEN 'Sample Collected' THEN 2
          ELSE 3
        END,
        cc.harvesting_date ASC NULLS LAST,
        cc.sample_collection_date ASC NULLS LAST;
    `;
    const rowsWithDefaults = data.rows.map(cycle => ({
        ...cycle,
        goods_collection_method: cycle.goods_collection_method || 'Farm'
    }));
    return rowsWithDefaults;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cycles pending sampling tasks.');
  }
}

/**
 * MODIFIED FOR PHASE 8 (LOADING): Fetches crop cycles that have status 'Weighed'
 * AND have bags remaining to load. Includes all necessary fields for the loading form.
 * *** No longer filters by location on the server. ***
 */
export async function getCyclesToWeigh(): Promise<CropCycleForEmployeeWeighing[]> {
  try {
    const currentYear = new Date().getFullYear(); // Ensure we only get current year cycles
    const data = await sql<CropCycleForEmployeeWeighing>`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        f.mobile_number,
        v.village_name as village,
        fa.location_name as farm_location,
        l.landmark_name,
        s.variety_name as seed_variety,
        cc.status,
        cc.goods_collection_method,
        cc.seed_bags_purchased,
        cc.seed_bags_returned,
        cc.lot_no,
        cc.quantity_in_bags,       -- Total bags weighed
        cc.bags_remaining_to_load  -- Bags available to load
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN villages v ON fa.village_id = v.village_id
      LEFT JOIN landmarks l ON fa.landmark_id = l.landmark_id
      WHERE cc.status = 'Weighed'
        AND cc.bags_remaining_to_load > 0 -- Only fetch cycles with bags left to load
        AND cc.crop_cycle_year = ${currentYear} -- Filter by current year
      ORDER BY cc.weighing_date ASC NULLS LAST; -- Order by weighing date
    `;
    // Apply default for goods_collection_method if null
    const rowsWithDefaults = data.rows.map(cycle => ({
        ...cycle,
        goods_collection_method: cycle.goods_collection_method || 'Farm'
    }));
    return rowsWithDefaults;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cycles ready for loading.');
  }
}