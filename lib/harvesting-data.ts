// lib/harvesting-data.ts
import { sql } from '@vercel/postgres';
import { CycleForHarvesting } from './definitions';

/**
 * Fetches the comprehensive data for a single crop cycle needed for the harvesting and sampling form.
 */
export async function getCycleForHarvesting(cycleId: number): Promise<CycleForHarvesting | null> {
  try {
    const data = await sql`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        fa.location_name as farm_location,
        l.landmark_name,
        s.variety_name as seed_variety,
        cc.harvesting_date::text,
        cc.goods_collection_method,
        NULL as lot_no, -- Placeholder until DB schema is updated
        cc.seed_bags_purchased,
        NULL as seed_bags_returned, -- Placeholder until DB schema is updated
        cc.sample_moisture,
        cc.sample_purity,
        cc.sample_stone as sample_dust, -- Renaming for clarity as requested
        cc.sample_colors,
        cc.sample_non_seed,
        cc.sample_remarks,
        cc.final_price_per_quintal as final_price_per_man, -- Renaming for clarity as requested
        cc.total_bags_weighed
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
    return data.rows[0] as CycleForHarvesting;

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cycle details for harvesting form.');
  }
}