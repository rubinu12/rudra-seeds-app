"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

export type SowingEntry = {
  crop_cycle_id: number;
  farmer_name: string;
  village_name: string;
  seed_variety: string;
  seed_id: number;
  lot_no: string | null;
  sowing_date: string;
};

// --- 1. GET MASTER DATA (Seeds) ---
export async function getLotMasterData() {
  try {
    const seeds =
      await sql`SELECT seed_id, variety_name FROM seeds WHERE is_active = TRUE ORDER BY variety_name`;
    return { seeds: seeds.rows };
  } catch (e) {
    return { seeds: [] };
  }
}

// --- 2. GET SOWING DATA (Filtered by Seed) ---
export async function getSowingData(seedId?: number): Promise<SowingEntry[]> {
  try {
    // Base Query
    let query = `
            SELECT 
                cc.crop_cycle_id, 
                f.name as farmer_name, 
                COALESCE(v.village_name, 'Unknown') as village_name,
                s.variety_name as seed_variety,
                cc.seed_id,
                cc.lot_no,
                TO_CHAR(cc.sowing_date, 'YYYY-MM-DD') as sowing_date
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            JOIN seeds s ON cc.seed_id = s.seed_id
        `;

    // Apply Filter if Seed Selected
    if (seedId) {
      query += ` WHERE cc.seed_id = ${seedId}`;
    }

    query += ` ORDER BY cc.crop_cycle_id DESC`;

    const res = await sql.query(query);
    return res.rows as SowingEntry[];
  } catch (e) {
    console.error("Fetch Sowing Error:", e);
    return [];
  }
}

// --- 3. MANUAL UPDATE ---
export async function updateLotNumber(cycleId: number, lotNo: string) {
  try {
    await sql`UPDATE crop_cycles SET lot_no = ${lotNo} WHERE crop_cycle_id = ${cycleId}`;
    revalidatePath("/admin/sowing");
    return { success: true, message: "Lot Number Updated" };
  } catch (e) {
    return { success: false, message: "Update Failed" };
  }
}

// --- 4. BULK IMPORT (Seed Aware) ---
export async function bulkImportLotNumbers(jsonData: string, seedId: number) {
  try {
    if (!seedId)
      return { success: false, message: "Critical Error: No Seed Selected" };

    const entries = JSON.parse(jsonData);
    if (!Array.isArray(entries))
      return { success: false, message: "Invalid JSON: Must be an array" };

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const entry of entries) {
      if (entry.name && entry.lot) {
        // CRITICAL: We ONLY update records matching the Selected Seed ID
        const res = await sql`
                    UPDATE crop_cycles 
                    SET lot_no = ${entry.lot}
                    FROM farmers 
                    WHERE crop_cycles.farmer_id = farmers.farmer_id 
                    AND farmers.name ILIKE ${`%${entry.name}%`} 
                    AND crop_cycles.seed_id = ${seedId}
                `;

        if (res.rowCount != null && res.rowCount > 0) updatedCount++;
        else notFoundCount++;
      }
    }

    revalidatePath("/admin/sowing");
    return {
      success: true,
      message: `Updated ${updatedCount} farmers. (${notFoundCount} names not found for this seed)`,
    };
  } catch (e) {
    return { success: false, message: "Invalid JSON Format" };
  }
}
