"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth"; // Security

// --- Fetch Pending Weighing List ---
export async function getPendingWeighing() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
      console.error("Unauthorized access to weighing list");
      return [];
    }

    console.log(`⚖️ Fetching Weighing List for User ID: ${userId}`);

    const result = await sql`
            SELECT 
                cc.crop_cycle_id,
                f.name as farmer_name,
                f.mobile_number,
                v.village_name, 
                l.landmark_name,
                s.variety_name as seed_variety, 
                s.color_code,
                cc.status, 
                cc.lot_no,
                cc.goods_collection_method as collection_loc,
                cc.seed_bags_purchased,
                cc.seed_bags_returned,

                -- Assignment Check
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
            
            WHERE cc.status = 'Priced'
            ORDER BY cc.pricing_date ASC
        `;

    return result.rows;
  } catch (e: any) {
    console.error("Fetch Error:", e.message);
    return [];
  }
}

// --- Submit Weighing Data ---

const WeighingSchema = z.object({
  cropCycleId: z.coerce.number(),
  lotNo: z.string().min(1, "Lot Number is required."),
  bags: z.coerce.number().min(1, "Bags must be at least 1."),
});

export async function submitWeighing(prevState: any, formData: FormData) {
  // 1. Security Check
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
      return { success: false, message: "Unauthorized: Please login." };
  }

  const validation = WeighingSchema.safeParse({
    cropCycleId: formData.get("cropCycleId"),
    lotNo: formData.get("lotNo"),
    bags: formData.get("bags"),
  });

  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  const { cropCycleId, lotNo, bags } = validation.data;

  try {
    const check = await sql`
            SELECT lot_no, seed_bags_purchased, seed_bags_returned 
            FROM crop_cycles 
            WHERE crop_cycle_id = ${cropCycleId}
        `;

    if (check.rows.length === 0) {
      return { success: false, message: "Cycle not found." };
    }

    const cycle = check.rows[0];

    if (cycle.lot_no?.trim().toUpperCase() !== lotNo.trim().toUpperCase()) {
      return {
        success: false,
        message: `Lot Number Mismatch! System expects: ${cycle.lot_no}`,
      };
    }

    const purchased = Number(cycle.seed_bags_purchased || 0);
    const returned = Number(cycle.seed_bags_returned || 0);
    const finalSeedBags = purchased - returned;
    const threshold = finalSeedBags > 0 ? finalSeedBags * 50 : 0;
    const isFlagged = threshold > 0 && bags > threshold;

    // 2. Update & Track
    await sql`
            UPDATE crop_cycles
            SET 
                status = 'Weighed',
                quantity_in_bags = ${bags},
                bags_remaining_to_load = ${bags},
                weighing_date = NOW(),
                is_production_flagged = ${isFlagged},
                weighed_by = ${userId} -- Tracking
            WHERE crop_cycle_id = ${cropCycleId}
        `;

    revalidatePath("/employee/dashboard");

    return {
      success: true,
      message: isFlagged
        ? `Saved! Warning: Yield is unnaturally high (${bags} bags). Flagged for Admin.`
        : "Weighing recorded successfully.",
    };
  } catch (e: any) {
    console.error("Weighing Error:", e.message);
    return { success: false, message: "Database Error: " + e.message };
  }
}