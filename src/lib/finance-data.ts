"use server";

import { sql } from "@vercel/postgres";

export type CompanyLedger = {
  company_id: number;
  company_name: string;
  total_shipments_value: number;
  total_received: number;
  current_due: number;
  last_payment_date: string | null;
};

export type Wallet = {
  wallet_id: number;
  wallet_name: string;
  balance: number;
};

// 1. Get Denish's Virtual Balances
export async function getWallets(): Promise<Wallet[]> {
  try {
    const res =
      await sql<Wallet>`SELECT * FROM virtual_wallets ORDER BY wallet_id`;
    return res.rows;
  } catch (_e) {
    return [];
  }
}

// 2. The Master Ledger: Calculate Status of All Seed Companies
export async function getCompanyLedgers(): Promise<CompanyLedger[]> {
  try {
    const data = await sql`
            WITH shipment_totals AS (
                SELECT 
                    dest_company_id, 
                    SUM(total_bags * 50 * 150) as total_value 
                FROM shipments 
                WHERE status = 'Dispatched'
                GROUP BY dest_company_id
            ),
            payment_totals AS (
                SELECT 
                    dest_company_id, 
                    SUM(amount) as total_received,
                    MAX(payment_date) as last_payment
                FROM company_payments
                GROUP BY dest_company_id
            )
            SELECT 
                dc.dest_company_id,
                dc.company_name,
                COALESCE(st.total_value, 0) as total_shipments_value,
                COALESCE(pt.total_received, 0) as total_received,
                (COALESCE(st.total_value, 0) - COALESCE(pt.total_received, 0)) as current_due,
                pt.last_payment as last_payment_date
            FROM destination_companies dc
            LEFT JOIN shipment_totals st ON dc.dest_company_id = st.dest_company_id
            LEFT JOIN payment_totals pt ON dc.dest_company_id = pt.dest_company_id
            ORDER BY current_due DESC;
        `;

    return data.rows.map((row) => ({
      company_id: Number(row.dest_company_id),
      company_name: row.company_name ?? "",
      total_shipments_value: Number(row.total_shipments_value),
      total_received: Number(row.total_received),
      current_due: Number(row.current_due),
      last_payment_date: row.last_payment_date
        ? String(row.last_payment_date)
        : null,
    }));
  } catch (e) {
    console.error("Ledger Error:", e);
    return [];
  }
}

// 3. Record a New Lump Sum Payment (The "Add Money" Action)
export async function recordIncomingPayment(
  companyId: number,
  amount: number,
  walletId: number,
  mode: string,
  ref: string
) {
  try {
    await sql`
            INSERT INTO company_payments (dest_company_id, amount, target_wallet_id, payment_mode, reference_number)
            VALUES (${companyId}, ${amount}, ${walletId}, ${mode}, ${ref})
        `;

    await sql`
            UPDATE virtual_wallets 
            SET balance = balance + ${amount}
            WHERE wallet_id = ${walletId}
        `;

    return { success: true };
  } catch (_e) {
    return { success: false, message: "Database error" };
  }
}