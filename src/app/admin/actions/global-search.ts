"use server";

import { sql } from "@vercel/postgres";
import { markAsHarvested } from "@/src/app/employee/actions/harvest";

export type SearchResult = {
  id: number;
  title: string;          
  subtitle: string;       
  seed: string;           
  status: string;
  actionLabel: string | null;
  actionType: 'API' | 'MODAL' | 'REPRINT' | 'NONE'; 
  meta: {
    mobile: string;
    lot: string | null;
  };
};

interface GlobalSearchRow {
  crop_cycle_id: number;
  status: string | null;
  farmer_name: string;
  mobile_number: string;
  village_name: string | null;
  landmark_name: string | null;
  variety_name: string;
  lot_no: string | null; // This will now come from STRING_AGG
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
        
        -- [FIX 1] Select aggregated lots
        (
            SELECT STRING_AGG(lot_number, ', ') 
            FROM cycle_lots 
            WHERE crop_cycle_id = cc.crop_cycle_id
        ) as lot_no

      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fa ON cc.farm_id = fa.farm_id
      LEFT JOIN villages v ON fa.village_id = v.village_id
      LEFT JOIN landmarks l ON fa.landmark_id = l.landmark_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      
      -- [FIX 2] Filter logic
      WHERE 
        f.name ILIKE ${searchTerm} 
        OR f.mobile_number ILIKE ${searchTerm}
        -- Check if ANY lot matches the search term
        OR EXISTS (
            SELECT 1 FROM cycle_lots cl 
            WHERE cl.crop_cycle_id = cc.crop_cycle_id 
            AND cl.lot_number ILIKE ${searchTerm}
        )
      ORDER BY cc.crop_cycle_id DESC
      LIMIT 10
    `;

    const rows = res.rows as unknown as GlobalSearchRow[];
    return rows.map((row) => mapStatusToAction(row));
  } catch (e) {
    console.error("Global Search Error:", e);
    return [];
  }
}

// ... [Keep mapStatusToAction and performGlobalAction exactly as they are] ...
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

  const status = (row.status || '').toLowerCase();

  if (status === 'growing') return { ...base, actionLabel: 'Mark Harvested', actionType: 'API' };
  if (status === 'sample collected') return { ...base, actionLabel: 'Enter Lab Data', actionType: 'MODAL' };
  if (status === 'sampled') return { ...base, actionLabel: 'Propose Price', actionType: 'MODAL' };
  if (status === 'price proposed') return { ...base, actionLabel: 'Verify Price', actionType: 'MODAL' };
  if (status === 'loaded') return { ...base, actionLabel: 'Process Payment', actionType: 'MODAL' };
  if (status === 'paid' || status === 'cleared' || status === 'cheque generated') return { ...base, actionLabel: 'Reprint Cheques', actionType: 'REPRINT' };

  return { ...base, actionLabel: row.status, actionType: 'NONE' };
}

export async function performGlobalAction(cycleId: number, action: string) {
    if(action === 'Mark Harvested') {
        return await markAsHarvested(cycleId, 'Farm');
    }
    return { success: false, message: "Unknown Action" };
}