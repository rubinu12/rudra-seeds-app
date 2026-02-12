"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

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
  noStore();
  try {
    const seeds =
      await sql`SELECT seed_id, variety_name FROM seeds WHERE is_active = TRUE ORDER BY variety_name`;
    return { seeds: seeds.rows };
  } catch (error) {
    console.error("Master Data Error", error);
    return { seeds: [] };
  }
}

// --- 2. GET SOWING DATA (Filtered by Seed) ---
export async function getSowingData(seedId?: number): Promise<SowingEntry[]> {
  noStore();
  try {
    // We use a conditional query approach for safety
    let rows;
    
    if (seedId) {
       const res = await sql`
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
            WHERE cc.seed_id = ${seedId}
            ORDER BY cc.crop_cycle_id DESC
       `;
       rows = res.rows;
    } else {
       // Return empty if no seed selected to prevent massive data load
       return [];
    }

    return rows.map(row => ({
        crop_cycle_id: row.crop_cycle_id,
        farmer_name: row.farmer_name,
        village_name: row.village_name,
        seed_variety: row.seed_variety,
        seed_id: row.seed_id,
        lot_no: row.lot_no,
        sowing_date: row.sowing_date
    }));

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
  } catch (error) {
    console.error("Update Error", error);
    return { success: false, message: "Update Failed" };
  }
}

// --- 4. BULK IMPORT (Seed Aware) ---
export async function bulkImportLotNumbers(jsonData: string, seedId: number) {
  try {
    if (!seedId)
      return { success: false, message: "Critical Error: No Seed Selected" };

    let entries;
    try {
        entries = JSON.parse(jsonData);
    } catch {
        return { success: false, message: "Invalid JSON Format" };
    }

    if (!Array.isArray(entries))
      return { success: false, message: "Invalid JSON: Must be an array" };

    let updatedCount = 0;
    
    // Process sequentially
    for (const entry of entries) {
      if (entry.name && entry.lot) {
        // Safe update using ILIKE for loose name matching
        const res = await sql`
            UPDATE crop_cycles 
            SET lot_no = ${entry.lot}
            FROM farmers 
            WHERE crop_cycles.farmer_id = farmers.farmer_id 
            AND farmers.name ILIKE ${`%${entry.name}%`} 
            AND crop_cycles.seed_id = ${seedId}
        `;
        if (res.rowCount && res.rowCount > 0) updatedCount++;
      }
    }

    revalidatePath("/admin/sowing");
    return {
      success: true,
      message: `Updated ${updatedCount} farmers successfully.`,
    };
  } catch (error) {
    console.error("Bulk Import Error", error);
    return { success: false, message: "Server Error during import" };
  }
}