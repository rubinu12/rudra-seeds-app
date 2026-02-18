"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

// [EXISTING TYPE - Unchanged]
export type SowingEntry = {
  crop_cycle_id: number;
  farmer_name: string;
  village_name: string;
  seed_variety: string;
  seed_id: number;
  lot_numbers: string[]; 
  sowing_date: string;
};

// [EXISTING FUNCTIONS - getLotMasterData, getSowingData, updateCycleLots, bulkImportLotNumbers - Keep them as they are]
// ... (Include them or assume they are there. I will output the NEW function below)

// --- NEW DIAGNOSTIC ACTION ---
export async function getMissingLotData(): Promise<SowingEntry[]> {
  noStore();
  try {
    // specific check: Find cycles that have NO MATCHING ROW in cycle_lots
    const res = await sql`
        SELECT 
            cc.crop_cycle_id, 
            f.name as farmer_name, 
            COALESCE(v.village_name, 'Unknown') as village_name,
            s.variety_name as seed_variety,
            cc.seed_id,
            TO_CHAR(cc.sowing_date, 'YYYY-MM-DD') as sowing_date
        FROM crop_cycles cc
        JOIN farmers f ON cc.farmer_id = f.farmer_id
        JOIN farms fm ON cc.farm_id = fm.farm_id
        LEFT JOIN villages v ON fm.village_id = v.village_id
        JOIN seeds s ON cc.seed_id = s.seed_id
        LEFT JOIN cycle_lots cl ON cc.crop_cycle_id = cl.crop_cycle_id
        WHERE cl.lot_id IS NULL 
        -- Optional: Filter out old/completed cycles if needed
        -- AND cc.status NOT IN ('Completed', 'Marketed')
        ORDER BY cc.sowing_date DESC, f.name ASC
    `;

    return res.rows.map(row => ({
        crop_cycle_id: row.crop_cycle_id,
        farmer_name: row.farmer_name,
        village_name: row.village_name,
        seed_variety: row.seed_variety,
        seed_id: row.seed_id,
        lot_numbers: [], // By definition, these are empty
        sowing_date: row.sowing_date
    }));

  } catch (e) {
    console.error("Diagnostic Error:", e);
    return [];
  }
}

// ... [Keep existing export functions: getLotMasterData, getSowingData, updateCycleLots, bulkImportLotNumbers]
export async function getLotMasterData() {
  noStore();
  try {
    const seeds = await sql`SELECT seed_id, variety_name FROM seeds WHERE is_active = TRUE ORDER BY variety_name`;
    return { seeds: seeds.rows };
  } catch (error) {
    console.error("Master Data Error", error);
    return { seeds: [] };
  }
}

export async function getSowingData(seedId?: number): Promise<SowingEntry[]> {
  noStore();
  try {
    if (!seedId) return [];

    const res = await sql`
        SELECT 
            cc.crop_cycle_id, 
            f.name as farmer_name, 
            COALESCE(v.village_name, 'Unknown') as village_name,
            s.variety_name as seed_variety,
            cc.seed_id,
            ARRAY_REMOVE(ARRAY_AGG(cl.lot_number ORDER BY cl.lot_id), NULL) as lot_numbers,
            TO_CHAR(cc.sowing_date, 'YYYY-MM-DD') as sowing_date
        FROM crop_cycles cc
        JOIN farmers f ON cc.farmer_id = f.farmer_id
        JOIN farms fm ON cc.farm_id = fm.farm_id
        LEFT JOIN villages v ON fm.village_id = v.village_id
        JOIN seeds s ON cc.seed_id = s.seed_id
        LEFT JOIN cycle_lots cl ON cc.crop_cycle_id = cl.crop_cycle_id
        WHERE cc.seed_id = ${seedId}
        GROUP BY cc.crop_cycle_id, f.name, v.village_name, s.variety_name, cc.seed_id, cc.sowing_date
        ORDER BY cc.crop_cycle_id DESC
    `;

    return res.rows.map(row => ({
        crop_cycle_id: row.crop_cycle_id,
        farmer_name: row.farmer_name,
        village_name: row.village_name,
        seed_variety: row.seed_variety,
        seed_id: row.seed_id,
        lot_numbers: Array.isArray(row.lot_numbers) ? row.lot_numbers : [],
        sowing_date: row.sowing_date
    }));

  } catch (e) {
    console.error("Fetch Sowing Error:", e);
    return [];
  }
}

export async function updateCycleLots(cycleId: number, lots: string[]) {
  try {
    await sql`BEGIN`;
    await sql`DELETE FROM cycle_lots WHERE crop_cycle_id = ${cycleId}`;
    const uniqueLots = Array.from(new Set(lots)).filter(l => l.trim() !== "");
    if (uniqueLots.length > 0) {
        for (const lot of uniqueLots) {
             await sql`INSERT INTO cycle_lots (crop_cycle_id, lot_number) VALUES (${cycleId}, ${lot})`;
        }
    }
    await sql`COMMIT`;
    revalidatePath("/admin/sowing");
    return { success: true, message: "Lot Numbers Updated" };
  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Update Error", error);
    return { success: false, message: "Update Failed" };
  }
}

export async function bulkImportLotNumbers(jsonData: string, seedId: number) {
  try {
    if (!seedId) return { success: false, message: "Critical Error: No Seed Selected" };
    const entries = JSON.parse(jsonData);
    if (!Array.isArray(entries)) return { success: false, message: "Invalid JSON: Must be an array" };

    let updatedCount = 0;
    for (const entry of entries) {
      if (entry.name && entry.lot) {
        const findRes = await sql`
            SELECT cc.crop_cycle_id 
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            WHERE f.name ILIKE ${`%${entry.name}%`} 
            AND cc.seed_id = ${seedId}
            LIMIT 1
        `;

        if (findRes.rowCount && findRes.rowCount > 0) {
            const cycleId = findRes.rows[0].crop_cycle_id;
            let lotArray: string[] = [];
            if (Array.isArray(entry.lot)) {
                lotArray = entry.lot.map(String);
            } else if (typeof entry.lot === 'string') {
                lotArray = entry.lot.split(',').map((s: string) => s.trim());
            }
            const updateRes = await updateCycleLots(cycleId, lotArray);
            if (updateRes.success) updatedCount++;
        }
      }
    }
    revalidatePath("/admin/sowing");
    return { success: true, message: `Updated ${updatedCount} farmers successfully.` };
  } catch (error) {
    console.error("Bulk Import Error", error);
    return { success: false, message: "Server Error during import" };
  }
}