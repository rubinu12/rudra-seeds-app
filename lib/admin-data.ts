// lib/admin-data.ts
"use server";

import { sql } from '@vercel/postgres';

// --- Type Definitions ---

// Shape of the data for the pipeline status card
export type CyclePipelineStatus = {
  total: {
    harvested: number;
    sampled: number;
    priced: number;
    weighed: number;
  };
  last24Hours: {
    harvested: number;
    sampled: number;
    priced: number;
    weighed: number; // Assuming a 'weighing_date' column exists or logic adapts
  };
};

// Shape of the data for the critical alerts card
export type CriticalAlertsData = {
  pricedOver12DaysNotWeighed: number;
  weighedNotLoaded: number; // Assumes cycles move from 'Weighed' to another status like 'Loaded'/'Dispatched'
};

// Shape of the data for the financial overview card
export type FinancialOverviewData = {
  payments: {
    pending: number;
    given: number;
  };
  cheques: {
    dueTodayCount: number;
    dueTodayAmount: number;
  };
};

// Shape of the data for the shipment summary card
export type ShipmentSummaryItem = {
    destinationCompany: string; // Assuming we can join to get company name
    totalValueSent: number;
    totalPaymentReceived: number; // This might require joining with another table
};

export type ShipmentSummaryData = {
    shipments: ShipmentSummaryItem[];
    chequesToVerifyCount: number; // Placeholder, needs verification logic definition
};

// NEW: Shape of the data for the list of cycles pending sample entry
export type CycleForSampleEntry = {
    crop_cycle_id: number;
    farmer_name: string;
    seed_variety: string;
    sample_collection_date: string | null;
};


// --- Data Fetching Functions ---

/**
 * Fetches aggregated counts for each stage of the harvesting pipeline.
 */
export async function getCyclePipelineStatus(): Promise<CyclePipelineStatus> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const currentYear = new Date().getFullYear();

    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Harvested') as total_harvested,
        COUNT(*) FILTER (WHERE status = 'Sampled') as total_sampled,
        COUNT(*) FILTER (WHERE status = 'Priced') as total_priced,
        COUNT(*) FILTER (WHERE status = 'Weighed') as total_weighed,
        COUNT(*) FILTER (WHERE status = 'Harvested' AND harvesting_date >= ${twentyFourHoursAgo}) as last_24h_harvested,
        COUNT(*) FILTER (WHERE status = 'Sampled' AND sampling_date >= ${twentyFourHoursAgo}) as last_24h_sampled,
        COUNT(*) FILTER (WHERE status = 'Priced' AND pricing_date >= ${twentyFourHoursAgo}) as last_24h_priced
        -- COUNT(*) FILTER (WHERE status = 'Weighed' AND weighing_date >= ${twentyFourHoursAgo}) as last_24h_weighed -- Needs weighing_date column
      FROM crop_cycles
      WHERE crop_cycle_year = ${currentYear};
    `;
    const data = result.rows[0];
    return {
      total: {
        harvested: Number(data.total_harvested) || 0,
        sampled: Number(data.total_sampled) || 0,
        priced: Number(data.total_priced) || 0,
        weighed: Number(data.total_weighed) || 0,
      },
      last24Hours: {
        harvested: Number(data.last_24h_harvested) || 0,
        sampled: Number(data.last_24h_sampled) || 0,
        priced: Number(data.last_24h_priced) || 0,
        weighed: 0, // Placeholder
      },
    };
  } catch (error) {
    console.error('Database Error fetching pipeline status:', error);
    return { total: { harvested: 0, sampled: 0, priced: 0, weighed: 0 }, last24Hours: { harvested: 0, sampled: 0, priced: 0, weighed: 0 } };
  }
}

/**
 * Fetches counts for critical alerts related to harvesting delays.
 */
export async function getCriticalAlerts(): Promise<CriticalAlertsData> {
  try {
    const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString();
    const currentYear = new Date().getFullYear();
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Priced' AND pricing_date <= ${twelveDaysAgo}) as priced_over_12_days_not_weighed,
        COUNT(*) FILTER (WHERE status = 'Weighed') as weighed_not_loaded -- Assumes 'Weighed' is before 'Loaded'/'Dispatched'
      FROM crop_cycles
      WHERE crop_cycle_year = ${currentYear};
    `;
    const data = result.rows[0];
    return {
      pricedOver12DaysNotWeighed: Number(data.priced_over_12_days_not_weighed) || 0,
      weighedNotLoaded: Number(data.weighed_not_loaded) || 0,
    };
  } catch (error) {
    console.error('Database Error fetching critical alerts:', error);
    return { pricedOver12DaysNotWeighed: 0, weighedNotLoaded: 0 };
  }
}

/**
 * Fetches counts and sums for the financial overview card.
 */
export async function getFinancialOverview(): Promise<FinancialOverviewData> {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const currentYear = new Date().getFullYear();
    const relevantStatusesForPayment = ['Weighed', 'Loaded', 'Dispatched', 'Completed'];

    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = ANY(ARRAY[${relevantStatusesForPayment.join(',')}]) AND (is_farmer_paid IS NULL OR is_farmer_paid = FALSE)) as payments_pending,
        COUNT(*) FILTER (WHERE is_farmer_paid = TRUE) as payments_given,
        COUNT(*) FILTER (WHERE cheque_due_date >= ${todayStart.toISOString()} AND cheque_due_date <= ${todayEnd.toISOString()}) as cheques_due_today_count,
        SUM(final_payment) FILTER (WHERE cheque_due_date >= ${todayStart.toISOString()} AND cheque_due_date <= ${todayEnd.toISOString()}) as cheques_due_today_amount
      FROM crop_cycles
      WHERE crop_cycle_year = ${currentYear};
    `;
    const data = result.rows[0];
    return {
      payments: {
        pending: Number(data.payments_pending) || 0,
        given: Number(data.payments_given) || 0,
      },
      cheques: {
        dueTodayCount: Number(data.cheques_due_today_count) || 0,
        dueTodayAmount: Number(data.cheques_due_today_amount) || 0,
      },
    };
  } catch (error) {
    console.error('Database Error fetching financial overview:', error);
    return { payments: { pending: 0, given: 0 }, cheques: { dueTodayCount: 0, dueTodayAmount: 0 } };
  }
}

/**
 * Fetches aggregated data for the shipment summary card.
 */
export async function getShipmentSummary(): Promise<ShipmentSummaryData> {
    try {
        const currentYear = new Date().getFullYear();
        // Placeholder implementation - requires joins and potentially another table
        const shipmentResults = await sql`SELECT 'Placeholder Company' as destinationCompany, 0 as totalValueSent`;
        const chequesToVerifyCount = 0; // Placeholder logic

        return {
            shipments: shipmentResults.rows.map(row => ({
                destinationCompany: row.destinationcompany,
                totalValueSent: Number(row.totalvaluesent) || 0,
                totalPaymentReceived: 0, // Placeholder
            })),
            chequesToVerifyCount: chequesToVerifyCount,
        };

    } catch (error) {
        console.error('Database Error fetching shipment summary:', error);
        return { shipments: [], chequesToVerifyCount: 0 };
    }
}

/**
 * NEW: Fetches a list of crop cycles with status 'Sample Collected' for the admin.
 */
export async function getCyclesPendingSampleEntry(): Promise<CycleForSampleEntry[]> {
    try {
        const currentYear = new Date().getFullYear();
        const result = await sql<CycleForSampleEntry>`
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                s.variety_name as seed_variety,
                cc.sample_collection_date::text
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Sample Collected'
              AND cc.crop_cycle_year = ${currentYear}
            ORDER BY cc.sample_collection_date ASC; -- Show oldest samples first
        `;
        return result.rows;
    } catch (error) {
        console.error('Database Error fetching cycles pending sample entry:', error);
        return []; // Return empty array on error
    }
}