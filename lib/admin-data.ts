// lib/admin-data.ts
"use server";

import { sql } from '@vercel/postgres';
import type {
    CycleForSampleEntry,
    CycleForPriceApproval,
    CycleForPriceVerification
} from './definitions'; // Assuming definitions.ts exists and has these types

// --- Type Definitions ---
export type CyclePipelineStatus = {
  total: { harvested: number; sampled: number; priced: number; weighed: number; };
  last24Hours: { harvested: number; sampled: number; priced: number; weighed: number; };
};
export type CriticalAlertsData = { pricedOver12DaysNotWeighed: number; weighedNotLoaded: number; };
export type FinancialOverviewData = { payments: { pending: number; given: number; }; cheques: { dueTodayCount: number; dueTodayAmount: number; }; };
export type ShipmentSummaryItem = { destinationCompany: string; totalValueSent: number; totalPaymentReceived: number; };
export type ShipmentSummaryData = { shipments: ShipmentSummaryItem[]; chequesToVerifyCount: number; };

// *** ADDED TYPE for Edit Modal ***
export type CycleDetailsForEditing = {
    // Cycle Info
    crop_cycle_id: number;
    crop_cycle_year: number;
    season: string | null;
    status: string; // Keep status for context
    sowing_date: string; // Keep as string (YYYY-MM-DD)
    seed_bags_purchased: number;
    seed_bags_returned: number | null; // Nullable
    goods_collection_method: string | null;
    seed_cost: number | null;
    seed_payment_status: string | null; // 'Paid', 'Credit', 'Partial'
    amount_paid: number | null;
    amount_remaining: number | null;
    bank_accounts: string | null; // JSON string of selected account IDs

    // Farmer Info
    farmer_id: number;
    farmer_name: string;
    mobile_number: string | null;
    aadhar_number: string | null;
    home_address: string | null;

    // Farm Info
    farm_id: number;
    location_name: string;
    area_in_vigha: number | null;
    landmark_id: number;
    village_id: number;

    // Seed Info
    seed_id: number;
    variety_name: string; // Include variety name for display

    // Related Info (for context or dropdowns if needed later)
    village_name: string;
    landmark_name: string;
};

export type DispatchedShipmentInfo = {
    shipment_id: number;
    vehicle_number: string | null;
    destination_company_name: string | null;
    dispatch_date: string | null; // Formatted date string
    total_bags: number | null;
    // Add company_payment if needed to show if already billed
    // company_payment: number | null;
};


// --- Data Fetching Functions ---

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
        const shipmentQueryText = `SELECT 'Placeholder Company' as destinationCompany, 0 as totalValueSent LIMIT 0`; // Placeholder, needs actual implementation
        const shipmentResults = await sql.query(shipmentQueryText, []);
        const chequeQueryText = `SELECT COUNT(*) as count FROM crop_cycles WHERE /* condition for cheques to verify */ crop_cycle_year = $1 LIMIT 1`; // Placeholder, needs actual implementation
        const chequeResult = await sql.query(chequeQueryText, [currentYear]);
        const chequesToVerifyCount = Number(chequeResult.rows[0]?.count) || 0;
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

export async function getCyclesPendingVerification(): Promise<CycleForPriceVerification[]> {
    try {
        const currentYear = new Date().getFullYear();
        const queryText = `
            SELECT
                cc.crop_cycle_id,
                f.name as farmer_name,
                f.mobile_number,
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
        return result.rows as CycleForPriceVerification[];
    } catch (error) {
        console.error('Database Error fetching cycles pending verification:', error);
        return [];
    }
}

// *** ADDED FUNCTION for Edit Modal ***
export async function getCycleDetailsForEditing(cycleId: number): Promise<CycleDetailsForEditing | null> {
    if (isNaN(cycleId) || cycleId <= 0) {
        console.error("Invalid cycleId provided:", cycleId);
        return null;
    }
    try {
        const result = await sql`
            SELECT
                cc.crop_cycle_id, cc.crop_cycle_year, cc.season, cc.status,
                TO_CHAR(cc.sowing_date, 'YYYY-MM-DD') as sowing_date, -- Format date
                cc.seed_bags_purchased, cc.seed_bags_returned, cc.goods_collection_method,
                cc.seed_cost, cc.seed_payment_status, cc.amount_paid, cc.amount_remaining,
                cc.bank_accounts, -- Assuming this is stored as JSON string '[ "id1", "id2" ]'

                f.farmer_id, f.name as farmer_name, f.mobile_number, f.aadhar_number, f.home_address,

                fa.farm_id, fa.location_name, fa.area_in_vigha, fa.landmark_id, fa.village_id,

                s.seed_id, s.variety_name,

                v.village_name,
                l.landmark_name
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fa ON cc.farm_id = fa.farm_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            JOIN villages v ON fa.village_id = v.village_id
            JOIN landmarks l ON fa.landmark_id = l.landmark_id
            WHERE cc.crop_cycle_id = ${cycleId};
        `;

        if (result.rowCount === 0) {
            return null; // Cycle not found
        }

        // Ensure numeric types are correctly handled (pg returns strings sometimes)
        const row = result.rows[0];
        const formattedData: CycleDetailsForEditing = {
          ...row,
          crop_cycle_id: Number(row.crop_cycle_id),
          crop_cycle_year: Number(row.crop_cycle_year),
          seed_bags_purchased: Number(row.seed_bags_purchased),
          seed_bags_returned: row.seed_bags_returned !== null ? Number(row.seed_bags_returned) : null,
          seed_cost: row.seed_cost !== null ? Number(row.seed_cost) : null,
          amount_paid: row.amount_paid !== null ? Number(row.amount_paid) : null,
          amount_remaining: row.amount_remaining !== null ? Number(row.amount_remaining) : null,
          farmer_id: Number(row.farmer_id),
          farm_id: Number(row.farm_id),
          area_in_vigha: row.area_in_vigha !== null ? Number(row.area_in_vigha) : null,
          landmark_id: Number(row.landmark_id),
          village_id: Number(row.village_id),
          seed_id: Number(row.seed_id),
          // Strings and nulls should be fine as they are
          // Explicitly cast potentially null fields that should be strings or null
          season: row.season as string | null,
          status: row.status as string,
          goods_collection_method: row.goods_collection_method as string | null,
          seed_payment_status: row.seed_payment_status as string | null,
          bank_accounts: row.bank_accounts as string | null, // Assuming JSON string
          mobile_number: row.mobile_number as string | null,
          aadhar_number: row.aadhar_number as string | null,
          home_address: row.home_address as string | null,
          location_name: row.location_name as string,
          variety_name: row.variety_name as string,
          village_name: row.village_name as string,
          landmark_name: row.landmark_name as string,
          sowing_date: '',
          farmer_name: ''
        };

        return formattedData;

    } catch (error) {
        console.error(`Database Error fetching details for cycle ${cycleId}:`, error);
        throw new Error(`Failed to fetch cycle details for editing.`);
    }
}