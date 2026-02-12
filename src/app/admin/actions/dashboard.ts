// src/app/admin/actions/dashboard.ts
"use server";

import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

export type DashboardStats = {
  pipeline: {
    harvested: number;
    sampled: number;
    priced: number;
    weighed: number;
  };
  finance: {
    pending_payments: number;
    cheques_due_today: number;
    cheques_amount: number;
  };
  alerts: {
    stuck_cycles: number; // Priced > 12 days ago
    ready_to_load: number; // Weighed but not shipped
  };
};

// FIXED: Removed unused 'p0' parameter
export async function getDashboardStats(year: number, _season?: string): Promise<DashboardStats> {
  noStore(); 
  
  try {
    const res = await sql`
        SELECT
          -- Pipeline Counts
          COUNT(*) FILTER (WHERE status = 'Harvested') as harvested,
          COUNT(*) FILTER (WHERE status = 'Sampled' OR status = 'Price Proposed') as sampled,
          COUNT(*) FILTER (WHERE status = 'Priced') as priced,
          COUNT(*) FILTER (WHERE status = 'Weighed') as weighed,
          
          -- Finance Counts
          COUNT(*) FILTER (WHERE status IN ('Weighed', 'Loaded', 'Dispatched', 'Completed') AND (is_farmer_paid IS NULL OR is_farmer_paid = FALSE)) as pending_payments,
          COUNT(*) FILTER (WHERE cheque_due_date = CURRENT_DATE) as cheques_due_today,
          COALESCE(SUM(final_payment) FILTER (WHERE cheque_due_date = CURRENT_DATE), 0) as cheques_amount,

          -- Alerts
          COUNT(*) FILTER (WHERE status = 'Priced' AND pricing_date <= NOW() - INTERVAL '12 days') as stuck_cycles,
          COUNT(*) FILTER (WHERE status = 'Weighed') as ready_to_load
        FROM crop_cycles
        WHERE crop_cycle_year = ${year}
      `;

    const data = res.rows[0];

    return {
      pipeline: {
        harvested: Number(data.harvested || 0),
        sampled: Number(data.sampled || 0),
        priced: Number(data.priced || 0),
        weighed: Number(data.weighed || 0),
      },
      finance: {
        pending_payments: Number(data.pending_payments || 0),
        cheques_due_today: Number(data.cheques_due_today || 0),
        cheques_amount: Number(data.cheques_amount || 0),
      },
      alerts: {
        stuck_cycles: Number(data.stuck_cycles || 0),
        ready_to_load: Number(data.ready_to_load || 0),
      }
    };
  } catch (error) {
    console.error("Dashboard Stats Fetch Error:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
}