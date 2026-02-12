"use server";

import { sql } from "@vercel/postgres";
import { markAsHarvested } from "@/src/app/employee/actions/harvest";

export type SearchResult = {
  id: number;
  title: string;          // Farmer Name
  subtitle: string;       // Village • Landmark
  seed: string;           // Seed Variety
  status: string;
  actionLabel: string | null;
  actionType: 'API' | 'MODAL' | 'REPRINT' | 'NONE'; 
  meta: {
    mobile: string;
    lot: string | null;
  };
};

// 1. Define the exact shape of the database row to avoid 'any'
interface GlobalSearchRow {
  crop_cycle_id: number;
  status: string | null;
  farmer_name: string;
  mobile_number: string;
  village_name: string | null;
  landmark_name: string | null;
  variety_name: string;
  lot_no: string | null;
}

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const searchTerm = `%${query}%`;

    const res = await sql`
      SELECT 
        cc.crop_cycle_id,
        cc.status,
        f.name as farmer_name,
        f.mobile_number,
        v.village_name,
        l.landmark_name,
        s.variety_name,
        cc.lot_no
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      LEFT JOIN villages v ON fa.village_id = v.village_id
      LEFT JOIN landmarks l ON fa.landmark_id = l.landmark_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE 
        f.name ILIKE ${searchTerm} 
        OR f.mobile_number ILIKE ${searchTerm}
        OR cc.lot_no ILIKE ${searchTerm}
      ORDER BY cc.crop_cycle_id DESC
      LIMIT 10
    `;

    // 2. Cast the raw database result to our strict interface
    const rows = res.rows as unknown as GlobalSearchRow[];

    return rows.map((row) => mapStatusToAction(row));
  } catch (e) {
    console.error("Global Search Error:", e);
    return [];
  }
}

// 3. Use the strict interface here
function mapStatusToAction(row: GlobalSearchRow): SearchResult {
  const base = {
    id: row.crop_cycle_id,
    title: row.farmer_name,
    subtitle: `${row.village_name || 'Unknown'} ${row.landmark_name ? '• ' + row.landmark_name : ''}`,
    seed: row.variety_name,
    status: row.status || '',
    meta: { 
        mobile: row.mobile_number, 
        lot: row.lot_no 
    },
  };

  // NORMALIZE STATUS
  const status = (row.status || '').toLowerCase();

  // 1. GROWING -> HARVEST (Quick Action)
  if (status === 'growing') {
      return { ...base, actionLabel: 'Mark Harvested', actionType: 'API' };
  }

  // 2. LAB DATA ENTRY
  if (status === 'sample collected') {
      return { ...base, actionLabel: 'Enter Lab Data', actionType: 'MODAL' };
  }

  // 3. PRICING FLOW
  if (status === 'sampled') {
      return { ...base, actionLabel: 'Propose Price', actionType: 'MODAL' };
  }
  if (status === 'price proposed') {
      return { ...base, actionLabel: 'Verify Price', actionType: 'MODAL' };
  }

  // 4. PAYMENT (Only 'Loaded' cycles are ready to pay)
  if (status === 'loaded') {
      return { ...base, actionLabel: 'Process Payment', actionType: 'MODAL' };
  }

  // 5. REPRINTING (Safe Mode - History)
  if (status === 'paid' || status === 'cleared' || status === 'cheque generated') {
      return { ...base, actionLabel: 'Reprint Cheques', actionType: 'REPRINT' };
  }

  // DEFAULT: READ ONLY
  return { ...base, actionLabel: row.status, actionType: 'NONE' };
}

export async function performGlobalAction(cycleId: number, action: string) {
    if(action === 'Mark Harvested') {
        return await markAsHarvested(cycleId, 'Farm');
    }
    return { success: false, message: "Unknown Action" };
}