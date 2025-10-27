// app/employee/harvesting/data.ts
"use server";

import { sql } from '@vercel/postgres';
// Import the expanded type definition
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';

// ... (getCyclesToSample function remains the same) ...
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
        cc.quantity_in_bags,
        cc.bags_remaining_to_load
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
 * RENAMED: Fetches crop cycles that have status 'Weighed'
 * AND have bags remaining to load. Includes all necessary fields for the loading form.
 */
export async function getCyclesReadyForLoading(): Promise<CropCycleForEmployeeWeighing[]> {
  try {
    const currentYear = new Date().getFullYear();
    console.log(`[data.ts] Fetching cycles ready for loading (Status='Weighed', Bags > 0, Year=${currentYear})...`); // <<< CONSOLE LOG 1
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
        cc.quantity_in_bags,
        cc.bags_remaining_to_load
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN villages v ON fa.village_id = v.village_id
      LEFT JOIN landmarks l ON fa.landmark_id = l.landmark_id
      WHERE cc.status = 'Weighed'
        AND cc.bags_remaining_to_load > 0
        AND cc.crop_cycle_year = ${currentYear}
      ORDER BY cc.weighing_date ASC NULLS LAST;
    `;
    console.log(`[data.ts] Found ${data.rows.length} cycles ready for loading.`); // <<< CONSOLE LOG 2
    // Log details of the first few cycles if found
    if (data.rows.length > 0) {
        console.log('[data.ts] First cycle details:', JSON.stringify(data.rows[0], null, 2));
    }

    const rowsWithDefaults = data.rows.map(cycle => ({
        ...cycle,
        goods_collection_method: cycle.goods_collection_method || 'Farm'
    }));
    return rowsWithDefaults;
  } catch (error) {
    console.error('[data.ts] Error fetching cycles ready for loading:', error); // <<< CONSOLE LOG 3 (Error case)
    throw new Error('Failed to fetch cycles ready for loading.');
  }
}


/**
 * NEW: Fetches crop cycles that have status 'Priced' for the Weighing tab.
 */
export async function getCyclesToStartWeighing(): Promise<CropCycleForEmployeeWeighing[]> {
  try {
    const currentYear = new Date().getFullYear();
    // Query is similar to getCyclesReadyForLoading but filters by status = 'Priced'
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
        cc.quantity_in_bags,
        cc.bags_remaining_to_load
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN villages v ON fa.village_id = v.village_id
      LEFT JOIN landmarks l ON fa.landmark_id = l.landmark_id
      WHERE cc.status = 'Priced'
        AND cc.crop_cycle_year = ${currentYear}
      ORDER BY cc.pricing_date ASC NULLS LAST;
    `;
    const rowsWithDefaults = data.rows.map(cycle => ({
        ...cycle,
        goods_collection_method: cycle.goods_collection_method || 'Farm'
    }));
    return rowsWithDefaults;
  } catch (error) {
    console.error('Database Error fetching cycles to start weighing:', error);
    throw new Error('Failed to fetch cycles ready for weighing.');
  }
}