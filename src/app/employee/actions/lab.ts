"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth"; // Security

export async function getSampleDetails(cycleId: number) {
  console.log("🔍 Fetching Cycle ID:", cycleId);
  try {
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

    if (result.rows.length === 0) return null;

    const data = result.rows[0];

    // Safe Date Formatting
    const dateRaw = data.harvesting_date || data.created_at || new Date();
    try {
      data.formatted_date = new Date(dateRaw).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      data.formatted_date = "N/A";
    }

    return data;
  } catch (e: any) {
    console.error("Database Error:", e.message);
    return null;
  }
}

export async function submitLabData(cycleId: number, formData: FormData) {
  try {
    // 1. Security Check
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
        return { success: false, message: "Unauthorized: Please login." };
    }

    const moisture = formData.get("sample_moisture");
    const purity = formData.get("sample_purity");
    const dust = formData.get("dust_percentage");
    const non_seed = formData.get("sample_non_seed");
    const color = formData.get("color_grade");
    const remarks = formData.get("remarks");
    const collection_method = formData.get("goods_collection_method");

    // 2. Update & Track
    await sql`
            UPDATE crop_cycles 
            SET 
                sample_moisture = ${moisture ? Number(moisture) : null},
                sample_purity = ${purity ? Number(purity) : null},
                dust_percentage = ${dust ? Number(dust) : null},
                sample_non_seed = ${non_seed?.toString()},
                color_grade = ${color?.toString()},
                goods_collection_method = ${collection_method?.toString()},
                sample_remarks = ${remarks?.toString()},
                
                status = 'Sampled', 
                sampling_date = NOW(),
                sampled_by = ${userId} -- Tracking the Lab Tech
            WHERE crop_cycle_id = ${cycleId}
        `;

    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (e: any) {
    console.error("Submit Error:", e.message);
    return { success: false, message: e.message };
  }
}