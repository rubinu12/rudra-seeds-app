// lib/admin-data.ts
"use server";

import { sql } from '@vercel/postgres';
import type {
    CycleForSampleEntry,
    CycleForPriceApproval,
    CycleForPriceVerification
} from './definitions';

// --- Type Definitions ---
// (CyclePipelineStatus, CriticalAlertsData, FinancialOverviewData, ShipmentSummaryItem, ShipmentSummaryData remain the same)
export type CyclePipelineStatus = {
  total: { harvested: number; sampled: number; priced: number; weighed: number; };
  last24Hours: { harvested: number; sampled: number; priced: number; weighed: number; };
};
export type CriticalAlertsData = { pricedOver12DaysNotWeighed: number; weighedNotLoaded: number; };
export type FinancialOverviewData = { payments: { pending: number; given: number; }; cheques: { dueTodayCount: number; dueTodayAmount: number; }; };
export type ShipmentSummaryItem = { destinationCompany: string; totalValueSent: number; totalPaymentReceived: number; };
export type ShipmentSummaryData = { shipments: ShipmentSummaryItem[]; chequesToVerifyCount: number; };


// --- Data Fetching Functions ---
// (getCyclePipelineStatus, getCriticalAlerts, getFinancialOverview, getShipmentSummary, getCyclesPendingSampleEntry, getCyclesPendingTempPrice remain the same)

export async function getCyclePipelineStatus(): Promise<CyclePipelineStatus> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const currentYear = new Date().getFullYear();
    const queryText = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'Harvested') as total_harvested,
        COUNT(*) FILTER (WHERE status = 'Sampled' OR status = 'Price Proposed') as total_sampled,
        COUNT(*) FILTER (WHERE status = 'Priced') as total_priced,
        COUNT(*) FILTER (WHERE status = 'Weighed') as total_weighed,
        COUNT(*) FILTER (WHERE status = 'Harvested' AND harvesting_date >= $1) as last_24h_harvested,
        COUNT(*) FILTER (WHERE (status = 'Sampled' OR status = 'Price Proposed') AND sampling_date >= $1) as last_24h_sampled,
        COUNT(*) FILTER (WHERE status = 'Priced' AND pricing_date >= $1) as last_24h_priced,
        COUNT(*) FILTER (WHERE status = 'Weighed' /* AND weighing_date >= $1 */) as last_24h_weighed
      FROM crop_cycles
      WHERE crop_cycle_year = $2;
    `;
    const result = await sql.query(queryText, [twentyFourHoursAgo, currentYear]);
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
        weighed: Number(data.last_24h_weighed) || 0,
      },
    };
  } catch (error) {
    console.error('Database Error fetching pipeline status:', error);
    return { total: { harvested: 0, sampled: 0, priced: 0, weighed: 0 }, last24Hours: { harvested: 0, sampled: 0, priced: 0, weighed: 0 } };
  }
}

export async function getCriticalAlerts(): Promise<CriticalAlertsData> {
  try {
    const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString();
    const currentYear = new Date().getFullYear();
    const queryText = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'Priced' AND pricing_date <= $1) as priced_over_12_days_not_weighed,
        COUNT(*) FILTER (WHERE status = 'Weighed') as weighed_not_loaded
      FROM crop_cycles
      WHERE crop_cycle_year = $2;
    `;
    const result = await sql.query(queryText, [twelveDaysAgo, currentYear]);
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

export async function getFinancialOverview(): Promise<FinancialOverviewData> {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const currentYear = new Date().getFullYear();
    const relevantStatusesForPayment = ['Weighed', 'Loaded', 'Dispatched', 'Completed'];
    const queryText = `
      SELECT
        COUNT(*) FILTER (WHERE status = ANY($1) AND (is_farmer_paid IS NULL OR is_farmer_paid = FALSE)) as payments_pending,
        COUNT(*) FILTER (WHERE is_farmer_paid = TRUE) as payments_given,
        COUNT(*) FILTER (WHERE cheque_due_date >= $2 AND cheque_due_date <= $3) as cheques_due_today_count,
        SUM(final_payment) FILTER (WHERE cheque_due_date >= $2 AND cheque_due_date <= $3) as cheques_due_today_amount
      FROM crop_cycles
      WHERE crop_cycle_year = $4;
    `;
    const result = await sql.query(queryText, [relevantStatusesForPayment, todayStart.toISOString(), todayEnd.toISOString(), currentYear]);
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

export async function getShipmentSummary(): Promise<ShipmentSummaryData> {
    try {
        const currentYear = new Date().getFullYear();
        const shipmentQueryText = `SELECT 'Placeholder Company' as destinationCompany, 0 as totalValueSent LIMIT 0`;
        const shipmentResults = await sql.query(shipmentQueryText, []);
        const chequeQueryText = `SELECT COUNT(*) as count FROM crop_cycles WHERE /* condition for cheques to verify */ crop_cycle_year = $1 LIMIT 1`;
        const chequeResult = await sql.query(chequeQueryText, [currentYear]);
        const chequesToVerifyCount = Number(chequeResult.rows[0]?.count) || 0;
        return {
            shipments: shipmentResults.rows.map(row => ({
                destinationCompany: row.destinationcompany,
                totalValueSent: Number(row.totalvaluesent) || 0,
                totalPaymentReceived: 0,
            })),
            chequesToVerifyCount: chequesToVerifyCount,
        };
    } catch (error) {
        console.error('Database Error fetching shipment summary:', error);
        return { shipments: [], chequesToVerifyCount: 0 };
    }
}

export async function getCyclesPendingSampleEntry(): Promise<CycleForSampleEntry[]> {
    try {
        const currentYear = new Date().getFullYear();
        const queryText = `
            SELECT
                cc.crop_cycle_id, f.name as farmer_name, s.variety_name as seed_variety,
                cc.sample_collection_date::text
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Sample Collected' AND cc.crop_cycle_year = $1
            ORDER BY cc.sample_collection_date ASC NULLS FIRST;
        `;
        const result = await sql.query(queryText, [currentYear]);
        return result.rows as CycleForSampleEntry[];
    } catch (error) {
        console.error('Database Error fetching cycles pending sample entry:', error);
         return [];
    }
}

export async function getCyclesPendingTempPrice(): Promise<CycleForPriceApproval[]> {
    try {
        const currentYear = new Date().getFullYear();
        const queryText = `
            SELECT
                cc.crop_cycle_id, f.name as farmer_name, s.variety_name as seed_variety,
                cc.sampling_date::text, cc.sample_moisture, cc.sample_purity,
                cc.dust_percentage as sample_dust, cc.color_grade as sample_colors,
                cc.sample_non_seed
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Sampled' AND cc.crop_cycle_year = $1
            ORDER BY cc.sampling_date ASC NULLS FIRST;
        `;
        const result = await sql.query(queryText, [currentYear]);
        return result.rows as CycleForPriceApproval[];
    } catch (error) {
        console.error('Database Error fetching cycles pending temp price:', error);
        return [];
    }
}

/**
 * Fetches cycles with status 'Price Proposed' for final verification. (Phase 6)
 * *** Includes farmer's mobile number ***
 */
export async function getCyclesPendingVerification(): Promise<CycleForPriceVerification[]> {
    try {
        const currentYear = new Date().getFullYear();
        const queryText = `
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                f.mobile_number, -- *** ADDED mobile_number ***
                s.variety_name as seed_variety,
                cc.sampling_date::text,
                cc.sample_moisture,
                cc.sample_purity,
                cc.dust_percentage as sample_dust,
                cc.color_grade as sample_colors,
                cc.sample_non_seed,
                cc.temporary_price_per_man
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE cc.status = 'Price Proposed'
              AND cc.crop_cycle_year = $1
            ORDER BY cc.sampling_date ASC NULLS FIRST;
        `;
        const result = await sql.query(queryText, [currentYear]);
        // Update the type definition if mobile_number isn't already there
        return result.rows as CycleForPriceVerification[];
    } catch (error) {
        console.error('Database Error fetching cycles pending verification:', error);
        return [];
    }
}