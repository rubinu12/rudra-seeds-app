"use server";

import { sql } from '@vercel/postgres';

const CURRENT_USER_ID = 10; 

export async function getPendingSamples() { // Removed 'location' argument
    try {
        console.log(`🧪 Fetching ALL Pending Samples (No Filter)`);

        const result = await sql`
            SELECT 
                cc.crop_cycle_id,
                f.name as farmer_name,
                v.village_name, l.landmark_name,
                s.variety_name as seed_variety, s.color_code,
                cc.status, cc.lot_no, COALESCE(cc.quantity_in_bags, 0) as bags,
                f.mobile_number,
                
                -- We fetch the location so the UI can filter it
                cc.goods_collection_method as collection_loc,
                
                EXISTS (
                    SELECT 1 FROM employee_assignments ea 
                    WHERE ea.seed_id = cc.seed_id AND ea.user_id = ${CURRENT_USER_ID}
                ) as is_assigned
                
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            LEFT JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            LEFT JOIN landmarks l ON fm.landmark_id = l.landmark_id
            LEFT JOIN seeds s ON cc.seed_id = s.seed_id
            
            WHERE 
                cc.status = 'Harvested' 
                OR cc.status = 'Sample Collected'
            
            ORDER BY cc.crop_cycle_id DESC
        `;
        
        console.log(`✅ Found ${result.rows.length} total samples.`);
        return result.rows;

    } catch (e: any) {
        console.error("Fetch Error:", e.message);
        return [];
    }
}

export async function markSampleReceived(cycleId: number) {
    try {
        await sql`
            UPDATE crop_cycles SET status = 'Sample Collected', sample_collection_date = NOW() WHERE crop_cycle_id = ${cycleId}
        `;
        return { success: true };
    } catch (e) { return { success: false }; }
}