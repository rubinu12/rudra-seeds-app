"use server";

import { sql } from '@vercel/postgres';
import { auth } from "@/auth"; // Security

export async function getPendingSamples() {
    try {
        // 1. Get Real User
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;

        if (!userId) {
            console.error("⛔ Unauthorized: No user logged in for sample list.");
            return [];
        }

        console.log(`🧪 Fetching Pending Samples for User ID: ${userId}`);

        const result = await sql`
            SELECT 
                cc.crop_cycle_id,
                f.name as farmer_name,
                v.village_name, 
                l.landmark_name,
                s.variety_name as seed_variety, 
                s.color_code,
                cc.status, 
                cc.lot_no, 
                COALESCE(cc.quantity_in_bags, 0) as bags,
                f.mobile_number,
                
                -- Location for UI filtering
                cc.goods_collection_method as collection_loc,
                
                -- DYNAMIC ASSIGNMENT CHECK
                EXISTS (
                    SELECT 1 FROM employee_assignments ea 
                    WHERE ea.seed_id = cc.seed_id AND ea.user_id = ${userId}
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
        
        return result.rows;

    } catch (e: any) {
        console.error("Fetch Error:", e.message);
        return [];
    }
}

export async function markSampleReceived(cycleId: number) {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;

        if (!userId) return { success: false, message: "Unauthorized" };

        await sql`
            UPDATE crop_cycles 
            SET 
                status = 'Sample Collected', 
                sample_collection_date = NOW(),
                sampled_by = ${userId} -- Tracking the Collector
            WHERE crop_cycle_id = ${cycleId}
        `;
        return { success: true };
    } catch (e) { 
        return { success: false }; 
    }
}