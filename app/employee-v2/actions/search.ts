"use server";

import { sql } from '@vercel/postgres';

export async function searchGlobalCycles(query: string) {
    if (!query || query.length < 2) return [];

    console.log(`🔎 Searching Database: "${query}"`);

    try {
        const searchTerm = `%${query}%`;

        const result = await sql`
            SELECT 
                cc.crop_cycle_id,
                f.name as farmer_name,
                
                -- Location Data
                v.village_name,
                l.landmark_name,
                
                -- Seed Data (Variety & Color)
                s.variety_name as seed_variety,
                s.color_code,  -- Fetching color
                
                cc.status,
                cc.lot_no,     -- Fetching Lot No
                f.mobile_number,
                
                -- Bags
                COALESCE(cc.quantity_in_bags, 0) as bags,
                
                -- Payment Status (To show cheque message)
                cc.is_farmer_paid
                
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            
            LEFT JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            LEFT JOIN landmarks l ON fm.landmark_id = l.landmark_id
            LEFT JOIN seeds s ON cc.seed_id = s.seed_id
            
            WHERE 
                (f.name ILIKE ${searchTerm} OR f.mobile_number ILIKE ${searchTerm})
                -- We removed the 'Shipped' filter so you can see completed cycles too
            
            ORDER BY cc.crop_cycle_id DESC
            LIMIT 20
        `;
        
        return result.rows;

    } catch (e: any) {
        console.error("❌ Search Error:", e.message);
        return [];
    }
}