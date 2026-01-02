"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export async function getSampleDetails(cycleId: number) {
    console.log("🔍 Fetching Cycle ID:", cycleId); 
    try {
        // FIX: Use cc.* to get ALL columns. This prevents crashing if a specific column name is wrong.
        const result = await sql`
            SELECT 
                cc.*, 
                f.name as farmer_name,
                f.mobile_number,
                v.village_name,
                l.landmark_name,
                s.variety_name as seed_variety,
                s.color_code
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            LEFT JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            LEFT JOIN landmarks l ON fm.landmark_id = l.landmark_id
            LEFT JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.crop_cycle_id = ${cycleId}
        `;
        
        if (result.rows.length === 0) {
            console.error("❌ No record found for ID:", cycleId);
            return null;
        }

        const data = result.rows[0];
        
        // Safe Date Formatting (Check if column exists first)
        // If 'harvesting_date' doesn't exist, we try 'created_at', or default to Today
        const dateRaw = data.harvesting_date || data.created_at || new Date();
        try {
            data.formatted_date = new Date(dateRaw).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch (e) { data.formatted_date = 'N/A'; }
        
        return data;

    } catch (e: any) {
        console.error("🔥 DATABASE CRITICAL ERROR:", e.message);
        return null;
    }
}

export async function submitLabData(cycleId: number, formData: FormData) {
    try {
        const moisture = formData.get('sample_moisture');
        const purity = formData.get('sample_purity');
        const dust = formData.get('dust_percentage');
        const non_seed = formData.get('sample_non_seed');
        const color = formData.get('color_grade');
        const remarks = formData.get('remarks');
        
        // We try to save to 'goods_collection_method'. 
        // If this column doesn't exist in your DB, this specific UPDATE will fail.
        // Ensure you have this column or remove this line.
        const collection_method = formData.get('goods_collection_method');

        await sql`
            UPDATE crop_cycles 
            SET 
                sample_moisture = ${moisture ? Number(moisture) : null},
                sample_purity = ${purity ? Number(purity) : null},
                dust_percentage = ${dust ? Number(dust) : null},
                sample_non_seed = ${non_seed?.toString()},
                color_grade = ${color?.toString()},
                
                -- Ensure this column exists in your DB!
                goods_collection_method = ${collection_method?.toString()},
                
                sample_remarks = ${remarks?.toString()},
                status = 'Lab Tested', 
                sampling_date = NOW()
            WHERE crop_cycle_id = ${cycleId}
        `;
        
        revalidatePath('/employee-v2/dashboard');
        return { success: true };

    } catch (e: any) {
        console.error("Submit Error:", e.message);
        return { success: false, message: e.message };
    }
}