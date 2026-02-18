"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export type CycleForSampleEntry = {
  crop_cycle_id: number;
  farmer_name: string;
  seed_variety: string;
  lot_number: string | null; // [NEW FIELD]
};

export async function getCyclesPendingSampleEntry(): Promise<CycleForSampleEntry[]> {
  noStore();
  try {
    const result = await sql`
      SELECT
        cc.crop_cycle_id,
        f.name as farmer_name,
        s.variety_name as seed_variety,
        
        -- [FIX] Fetch multiple lots as a single string
        (
            SELECT STRING_AGG(lot_number, ', ') 
            FROM cycle_lots 
            WHERE crop_cycle_id = cc.crop_cycle_id
        ) as lot_number

      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE cc.status = 'Harvested'
      ORDER BY cc.harvesting_date ASC;
    `;
    return result.rows as CycleForSampleEntry[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function submitAdminSampleData(formData: FormData) {
  try {
    const cropCycleId = formData.get("cropCycleId");
    const moisture = formData.get("moisture");
    const purity = formData.get("purity");
    const dust = formData.get("dust");
    const colors = formData.get("colors");
    const non_seed = formData.get("non_seed");
    const temporary_price_per_man = formData.get("temporary_price_per_man");
    const remarks = formData.get("remarks");

    if (!cropCycleId) return { success: false, message: "ID Missing" };

    // Standard Update (No lot changes needed here, just saving quality)
    await sql`
        UPDATE crop_cycles 
        SET 
            sample_moisture = ${Number(moisture)},
            sample_purity = ${Number(purity)},
            dust_percentage = ${Number(dust)},
            color_grade = ${colors ? String(colors) : null},
            sample_non_seed = ${non_seed ? String(non_seed) : null},
            temporary_price_per_man = ${temporary_price_per_man ? Number(temporary_price_per_man) : null},
            sample_remarks = ${remarks ? String(remarks) : null},
            
            status = ${temporary_price_per_man ? 'Price Proposed' : 'Sampled'}, 
            sampling_date = NOW()
        WHERE crop_cycle_id = ${Number(cropCycleId)}
    `;

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Submit Sample Error", error);
    return { success: false, message: "Update Failed" };
  }
}