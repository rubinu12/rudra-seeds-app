// lib/harvesting-data.ts
import { sql } from '@vercel/postgres';
import { CycleForHarvesting } from './definitions'; // Import updated type

/**
 * Fetches the comprehensive data for a single crop cycle needed for the harvesting and sampling form.
 * Includes farmer, farm, village, landmark details, and existing sample/price data.
 */
export async function getCycleForHarvesting(cycleId: number): Promise<CycleForHarvesting | null> {
  try {
    // Updated query with more JOINs and fetching required columns
    const data = await sql`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        f.mobile_number,          -- Added farmer mobile
        fa.location_name as farm_location,
        v.village_name,           -- Added village name
        l.landmark_name,
        s.variety_name as seed_variety,
        cc.harvesting_date::text,
        cc.goods_collection_method,
        cc.lot_no,                -- Fetch existing lot_no
        cc.seed_bags_purchased,
        cc.seed_bags_returned,    -- Fetch existing returned bags
        -- Fetch sample columns (using newly added names)
        cc.sample_moisture,
        cc.sample_purity,
        cc.dust_percentage as sample_dust, -- Map dust_percentage to sample_dust
        cc.color_grade as sample_colors,  -- Map color_grade to sample_colors
        cc.sample_non_seed,
        cc.sample_remarks,
        cc.temporary_price_per_man, -- Fetch temporary price
        cc.purchase_rate as final_price_per_man, -- Map purchase_rate to final_price_per_man
        cc.quantity_in_bags as total_bags_weighed -- Map quantity_in_bags to total_bags_weighed
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      JOIN landmarks l ON fa.landmark_id = l.landmark_id
      JOIN villages v ON fa.village_id = v.village_id -- Added JOIN for village
      WHERE cc.crop_cycle_id = ${cycleId};
    `;

    if (data.rows.length === 0) {
      return null;
    }
    // Cast the result row to the updated CycleForHarvesting type
    return data.rows[0] as CycleForHarvesting;

  } catch (error) {
    console.error('Database Error fetching cycle for harvesting:', error);
    throw new Error('Failed to fetch cycle details for harvesting form.');
  }
}