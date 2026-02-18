"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// --- TYPES ---
export type WeighingItem = {
  crop_cycle_id: number;
  farmer_name: string;
  mobile_number: string;
  village_name: string;
  landmark_name: string;
  seed_variety: string;
  color_code?: string;
  status: string;
  lot_no: string; 
  collection_loc: string; // goods_collection_method
  is_assigned: boolean;   // Dynamic based on logged-in user
  seed_bags_purchased: number;
  seed_bags_returned: number;
};

export type CycleLotOption = {
  lot_id: number;
  lot_number: string;
  current_weight: number;
};

export type LotWeightInput = {
    lot_id: number;
    weight: number;
};

// --- 1. GET PENDING WEIGHING (Filtered by Status = 'Priced') ---
export async function getPendingWeighing(): Promise<WeighingItem[]> {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : 0;

  try {
    const res = await sql`
        SELECT 
            cc.crop_cycle_id,
            f.name as farmer_name,
            f.mobile_number,
            COALESCE(v.village_name, 'Unknown') as village_name,
            l.landmark_name,
            s.variety_name as seed_variety,
            s.color_code,
            cc.status,
            COALESCE(cc.goods_collection_method, 'Farm') as collection_loc,
            COALESCE(cc.seed_bags_purchased, 0) as seed_bags_purchased,
            COALESCE(cc.seed_bags_returned, 0) as seed_bags_returned,
            
            -- Fetch aggregated lots
            (
                SELECT STRING_AGG(lot_number, ', ') 
                FROM cycle_lots 
                WHERE crop_cycle_id = cc.crop_cycle_id
            ) as lot_no,

            -- Calculate if this cycle is assigned to the current user
            CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM employee_assignments ea 
                    WHERE ea.user_id = ${userId} AND ea.seed_id = cc.seed_id
                ) THEN true 
                ELSE false 
            END as is_assigned

        FROM crop_cycles cc
        JOIN farmers f ON cc.farmer_id = f.farmer_id
        JOIN farms fm ON cc.farm_id = fm.farm_id
        LEFT JOIN villages v ON fm.village_id = v.village_id
        LEFT JOIN landmarks l ON fm.landmark_id = l.landmark_id
        JOIN seeds s ON cc.seed_id = s.seed_id
        
        -- STRICT STATUS FILTER: Only 'Priced' are ready for weighing
        WHERE cc.status = 'Priced'
        ORDER BY cc.crop_cycle_id DESC
    `;

    return res.rows.map(row => ({
        crop_cycle_id: row.crop_cycle_id,
        farmer_name: row.farmer_name,
        mobile_number: row.mobile_number,
        village_name: row.village_name,
        landmark_name: row.landmark_name || "",
        seed_variety: row.seed_variety,
        color_code: row.color_code,
        status: row.status,
        lot_no: row.lot_no || "No Lot",
        collection_loc: row.collection_loc,
        is_assigned: row.is_assigned, 
        seed_bags_purchased: Number(row.seed_bags_purchased),
        seed_bags_returned: Number(row.seed_bags_returned)
    }));
  } catch (e) {
    console.error("Get Weighing List Error:", e);
    return [];
  }
}

// --- 2. GET LOT OPTIONS ---
export async function getCycleLots(cycleId: number): Promise<CycleLotOption[]> {
    try {
        const res = await sql`
            SELECT lot_id, lot_number, bags_weighed as current_weight 
            FROM cycle_lots 
            WHERE crop_cycle_id = ${cycleId}
            ORDER BY lot_id ASC
        `;
        return res.rows.map(r => ({
            lot_id: r.lot_id,
            lot_number: r.lot_number,
            current_weight: Number(r.current_weight || 0)
        }));
    } catch (e) {
        return [];
    }
}

// --- 3. SUBMIT WEIGHING ---
export async function submitWeighing(
    cycleId: number, 
    lots: LotWeightInput[],
    remarks: string
) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    await sql`BEGIN`;

    // 1. Update Each Lot
    for (const lot of lots) {
        await sql`
            UPDATE cycle_lots 
            SET bags_weighed = ${lot.weight} 
            WHERE lot_id = ${lot.lot_id} AND crop_cycle_id = ${cycleId}
        `;
    }

    // 2. Recalculate Total
    const sumRes = await sql`
        SELECT SUM(bags_weighed) as total 
        FROM cycle_lots 
        WHERE crop_cycle_id = ${cycleId}
    `;
    const newTotal = Number(sumRes.rows[0].total || 0);

    // 3. Update Parent Cycle
    await sql`
        UPDATE crop_cycles 
        SET 
            quantity_in_bags = ${newTotal},
            status = 'Weighed',
            weighing_date = NOW(),
            weighed_by = ${userId},
            sample_remarks = ${remarks} 
        WHERE crop_cycle_id = ${cycleId}
    `;

    await sql`COMMIT`;
    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (e) {
    await sql`ROLLBACK`;
    console.error("Submit Weighing Error:", e);
    return { success: false, message: "Failed to save weight" };
  }
}