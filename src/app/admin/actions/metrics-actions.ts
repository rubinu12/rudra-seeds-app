"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

// --- Types ---
export type LotDetail = {
    lot_id: number;
    lot_number: string;
    bags_weighed: number;
};

export type WeighedCycleDetail = {
    crop_cycle_id: number;
    farmer_name: string;
    variety_name: string;
    total_bags: number;
    lots: LotDetail[];
};

// --- 1. FETCH WEIGHED CYCLES WITH LOTS ---
export async function getWeighedCyclesWithLots(): Promise<WeighedCycleDetail[]> {
    try {
        const res = await sql`
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                s.variety_name,
                cc.quantity_in_bags as total_bags,
                (
                    SELECT COALESCE(json_agg(json_build_object(
                        'lot_id', cl.lot_id,
                        'lot_number', cl.lot_number,
                        'bags_weighed', COALESCE(cl.bags_weighed, 0)
                    )), '[]'::json)
                    FROM cycle_lots cl
                    WHERE cl.crop_cycle_id = cc.crop_cycle_id
                ) as lots
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Weighed'
            ORDER BY cc.weighing_date DESC NULLS LAST;
        `;

        return res.rows.map(row => ({
            crop_cycle_id: row.crop_cycle_id,
            farmer_name: row.farmer_name,
            variety_name: row.variety_name,
            total_bags: row.total_bags || 0,
            lots: row.lots
        }));
    } catch (e) {
        console.error("Error fetching weighed cycles:", e);
        return [];
    }
}

// --- 2. UPDATE WEIGHTS IN BOTH TABLES ---
export async function updateCycleLotWeights(cycleId: number, lots: { lot_id: number, weight: number }[]) {
    try {
        await sql`BEGIN`;

        // 1. Update the individual lot rows
        for (const lot of lots) {
            await sql`
                UPDATE cycle_lots
                SET bags_weighed = ${lot.weight}
                WHERE lot_id = ${lot.lot_id} AND crop_cycle_id = ${cycleId}
            `;
        }

        // 2. Recalculate the master total dynamically
        const sumRes = await sql`
            SELECT SUM(bags_weighed) as total
            FROM cycle_lots
            WHERE crop_cycle_id = ${cycleId}
        `;
        const newTotal = Number(sumRes.rows[0].total || 0);

        // 3. Update the main crop_cycle table
        await sql`
            UPDATE crop_cycles
            SET quantity_in_bags = ${newTotal}
            WHERE crop_cycle_id = ${cycleId}
        `;

        await sql`COMMIT`;
        revalidatePath("/admin/dashboard"); 
        return { success: true, newTotal };
    } catch (e) {
        await sql`ROLLBACK`;
        console.error("Error updating weights:", e);
        return { success: false, message: "Failed to update weights" };
    }
}