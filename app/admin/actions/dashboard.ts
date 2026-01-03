"use server";

import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

// --- Definitions ---

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

// --- Main Fetch Function ---

export async function getDashboardStats(year: number, mode: string): Promise<DashboardStats> {
  // 1. Force fresh data on every call (essential for the "Manual Refresh" button)
  noStore();
  
  try {
    console.log(`⚡ Fetching Dashboard Stats | Season: ${year} | Mode: ${mode}`);

    // 2. Parallel Execution: Run all queries at once for speed
    const [pipelineRes, financeRes, alertRes] = await Promise.all([
      
      // Query A: Pipeline Counts (Filtered by Year)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Harvested') as harvested,
          COUNT(*) FILTER (WHERE status = 'Sampled' OR status = 'Price Proposed') as sampled,
          COUNT(*) FILTER (WHERE status = 'Priced') as priced,
          COUNT(*) FILTER (WHERE status = 'Weighed') as weighed
        FROM crop_cycles
        WHERE crop_cycle_year = ${year}
      `,
      
      // Query B: Finance Overview (Filtered by Year)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('Weighed', 'Loaded', 'Dispatched', 'Completed') AND (is_farmer_paid IS NULL OR is_farmer_paid = FALSE)) as pending_payments,
          COUNT(*) FILTER (WHERE cheque_due_date = CURRENT_DATE) as cheques_due_today,
          COALESCE(SUM(final_payment) FILTER (WHERE cheque_due_date = CURRENT_DATE), 0) as cheques_amount
        FROM crop_cycles
        WHERE crop_cycle_year = ${year}
      `,

      // Query C: Critical Alerts (Year Filter Applied to keep it context-specific)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Priced' AND pricing_date <= NOW() - INTERVAL '12 days') as stuck_cycles,
          COUNT(*) FILTER (WHERE status = 'Weighed') as ready_to_load
        FROM crop_cycles
        WHERE crop_cycle_year = ${year}
      `
    ]);

    // 3. Safety Parsing (Handle potential nulls from DB)
    const pipeline = pipelineRes.rows[0];
    const finance = financeRes.rows[0];
    const alerts = alertRes.rows[0];

    return {
      pipeline: {
        harvested: Number(pipeline?.harvested || 0),
        sampled: Number(pipeline?.sampled || 0),
        priced: Number(pipeline?.priced || 0),
        weighed: Number(pipeline?.weighed || 0),
      },
      finance: {
        pending_payments: Number(finance?.pending_payments || 0),
        cheques_due_today: Number(finance?.cheques_due_today || 0),
        cheques_amount: Number(finance?.cheques_amount || 0),
      },
      alerts: {
        stuck_cycles: Number(alerts?.stuck_cycles || 0),
        ready_to_load: Number(alerts?.ready_to_load || 0),
      }
    };

  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    // Return safe "Zero" state so the app doesn't crash
    return {
      pipeline: { harvested: 0, sampled: 0, priced: 0, weighed: 0 },
      finance: { pending_payments: 0, cheques_due_today: 0, cheques_amount: 0 },
      alerts: { stuck_cycles: 0, ready_to_load: 0 }
    };
  }
}