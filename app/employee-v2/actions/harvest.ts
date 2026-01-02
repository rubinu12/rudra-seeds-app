"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export async function markAsHarvested(cycleId: number, collectionLocation: string) {
    try {
        if (!cycleId) throw new Error("Invalid ID");

        // FIX: Removed 'updated_at' because your table doesn't have it.
        await sql`
            UPDATE crop_cycles 
            SET 
                status = 'Harvested', 
                harvesting_date = NOW(),
                goods_collection_method = ${collectionLocation}
            WHERE crop_cycle_id = ${cycleId}
        `;
        
        revalidatePath('/employee-v2/dashboard');
        return { success: true, message: "Marked as Harvested" };

    } catch (e: any) {
        console.error("Harvest Action Failed:", e.message);
        return { success: false, message: e.message };
    }
}