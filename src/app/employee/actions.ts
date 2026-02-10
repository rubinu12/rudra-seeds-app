"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

// --- GLOBAL SEARCH ---
export async function searchGlobalCycles(query: string) {
  // 1. Sanity Check
  if (!query || query.length < 2) return [];

  try {
    const searchTerm = `%${query}%`;

    // 2. Debug Log (Check your VS Code Terminal when you type!)
    console.log(`Searching for: ${query}`);

    const result = await sql`
            SELECT 
                cc.crop_cycle_id,
                f.name as farmer_name,
                f.village_name,
                cc.landmark_name,
                s.variety_name as seed_variety,
                cc.status,
                cc.mobile_number,
                cc.estimated_yield_bags as estimated_yield
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            LEFT JOIN seeds s ON cc.seed_id = s.seed_id  -- Changed to LEFT JOIN for safety
            WHERE 
                (f.name ILIKE ${searchTerm} OR cc.mobile_number ILIKE ${searchTerm})
                AND cc.status != 'Shipped' -- Optional: Don't show completed ones
            ORDER BY cc.updated_at DESC
            LIMIT 20
        `;

    console.log(`Found ${result.rows.length} results`);
    return result.rows;
  } catch (e) {
    console.error("Search Error:", e);
    return [];
  }
}

// --- ACTIONS ---
export async function markAsHarvested(cycleId: number) {
  try {
    await sql`UPDATE crop_cycles SET status = 'Harvested', updated_at = NOW() WHERE crop_cycle_id = ${cycleId}`;
    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
