"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

const WALLET_ID = 1;

// ==============================================================================
// 1. SHARED TYPES
// ==============================================================================

export type ChequeItem = {
  cycle_id: number;
  farmer_name: string;
  amount: number;
  cheque_number: string;
  due_date: string;
  index: number;
};

export type FinanceData = {
  balance: number;
  receivables: {
    company_id: number;
    company_name: string;
    total_due: number;
  }[];
  companies: { id: number; name: string }[];
  debtCheques: ChequeItem[];
  totalDebt: number;
  recentHistory: any[];
};

// ... (Other types like WalletStats, CompanyTradeStats remain the same) ...
export type WalletStats = {
  balance: number;
  transactions: {
    id: number;
    date: string;
    description: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    balance_after: number;
  }[];
};

export type CompanyTradeStats = {
  id: number;
  name: string;
  total_shipped_value: number;
  total_received: number;
  current_due: number;
  ledger: {
    date: string;
    type: string;
    amount: number;
    description: string;
  }[];
};

export type HarvestMetric = {
  farmer_id: number;
  farmer_name: string;
  village_name: string;
  seed_variety: string;
  sown_area_vigha: number;
  production_bags: number;
  total_cycle_value: number;
  amount_paid: number;
  amount_due: number;
  status: string;
};

// ==============================================================================
// 2. DATA FETCHERS
// ==============================================================================

export async function getFinanceDashboardData(): Promise<FinanceData> {
  try {
    // A. Wallet Balance
    const balanceRes = await sql`SELECT balance FROM virtual_wallets WHERE wallet_id = ${WALLET_ID}`;
    const balance = Number(balanceRes.rows[0]?.balance || 0);

    // B. Company List
    const compRes = await sql`SELECT dest_company_id as id, company_name as name FROM destination_companies ORDER BY company_name`;

    // C. RECEIVABLES
    const receivablesRes = await sql`
      SELECT 
        dc.dest_company_id as company_id,
        dc.company_name,
        COALESCE(SUM(CASE WHEN cl.transaction_type = 'DEBIT' THEN cl.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN cl.transaction_type = 'CREDIT' THEN cl.amount ELSE 0 END), 0) as total_due
      FROM destination_companies dc
      LEFT JOIN company_ledger cl ON dc.dest_company_id = cl.company_id
      GROUP BY dc.dest_company_id, dc.company_name
      HAVING (
        COALESCE(SUM(CASE WHEN cl.transaction_type = 'DEBIT' THEN cl.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN cl.transaction_type = 'CREDIT' THEN cl.amount ELSE 0 END), 0)
      ) > 0 
    `;

    // D. FARMER DEBT (FIXED: Handles due_date AND dueDate)
    const cyclesRes = await sql`
      SELECT cc.crop_cycle_id, f.name as farmer_name, cc.cheque_details 
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      WHERE cc.status ILIKE 'paid'
    `;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const debtCheques: ChequeItem[] = [];
    let totalDebt = 0;

    cyclesRes.rows.forEach(row => {
      const cheques = row.cheque_details || [];
      if (Array.isArray(cheques)) {
        cheques.forEach((c: any, idx: number) => {
          // 1. Identify the correct date field
          const dateString = c.due_date || c.dueDate; // <--- THE FIX

          // 2. Filter Logic
          if (c.status !== 'Cleared' && dateString) {
            const dDate = new Date(dateString);
            
            // 3. Show if Due Today or In the Past
            if (dDate <= today) {
              const amount = Number(c.amount);
              debtCheques.push({
                cycle_id: row.crop_cycle_id,
                farmer_name: row.farmer_name,
                amount: amount,
                cheque_number: c.cheque_number || c.chequeNo || c.chequeNumber, // Handle all cases
                due_date: dateString,
                index: idx
              });
              totalDebt += amount;
            }
          }
        });
      }
    });

    // E. History
    const historyRes = await sql`SELECT * FROM wallet_transactions WHERE wallet_id = ${WALLET_ID} ORDER BY transaction_date DESC LIMIT 50`;

    return {
      balance,
      receivables: receivablesRes.rows.map(r => ({
        company_id: r.company_id,
        company_name: r.company_name,
        total_due: Number(r.total_due)
      })),
      companies: compRes.rows as { id: number; name: string }[],
      debtCheques,
      totalDebt,
      recentHistory: historyRes.rows
    };

  } catch (e) {
    console.error("Finance Error", e);
    return { balance: 0, receivables: [], companies: [], debtCheques: [], totalDebt: 0, recentHistory: [] };
  }
}

// Alias
export async function getModalData(): Promise<FinanceData> {
    return getFinanceDashboardData();
}

// --- NEW SMART DASHBOARD FETCHERS (UNCHANGED) ---

export async function getWalletData(): Promise<WalletStats> {
  try {
    const walletRes = await sql`SELECT balance FROM virtual_wallets WHERE wallet_id = ${WALLET_ID}`;
    const currentBalance = Number(walletRes.rows[0]?.balance || 0);

    const txRes = await sql`
      SELECT transaction_id as id, transaction_date as date, description, transaction_type as type, amount
      FROM wallet_transactions WHERE wallet_id = ${WALLET_ID} ORDER BY transaction_date DESC LIMIT 50
    `;

    let running = currentBalance;
    const historyWithBalance = txRes.rows.map((tx: any) => {
      const entry = {
        id: tx.id, date: tx.date, description: tx.description, type: tx.type, amount: Number(tx.amount), balance_after: running
      };
      if (tx.type === 'CREDIT') running -= Number(tx.amount); else running += Number(tx.amount);
      return entry;
    });

    return { balance: currentBalance, transactions: historyWithBalance };
  } catch (error) {
    console.error("getWalletData Error:", error);
    return { balance: 0, transactions: [] };
  }
}

export async function getCompanyTradeBook(): Promise<CompanyTradeStats[]> {
  try {
    const companiesRes = await sql`SELECT dest_company_id, company_name FROM destination_companies ORDER BY company_name`;
    const ledgerRes = await sql`SELECT company_id, transaction_date, transaction_type, amount, description FROM company_ledger ORDER BY transaction_date DESC`;

    return companiesRes.rows.map((comp: any) => {
      const companyId = comp.dest_company_id;
      const companyLedger = ledgerRes.rows.filter((l: any) => l.company_id === companyId);
      let debits = 0, credits = 0;
      const formattedLedger = companyLedger.map((l: any) => {
        const amt = Number(l.amount);
        if (l.transaction_type === 'DEBIT') debits += amt;
        if (l.transaction_type === 'CREDIT') credits += amt;
        return { date: l.transaction_date, type: l.transaction_type, amount: amt, description: l.description };
      });
      return { id: companyId, name: comp.company_name, total_shipped_value: debits, total_received: credits, current_due: debits - credits, ledger: formattedLedger };
    });
  } catch (error) {
    console.error("getCompanyTradeBook Error:", error);
    return [];
  }
}

export async function getHarvestRegister(): Promise<HarvestMetric[]> {
  try {
    const result = await sql`
      SELECT f.farmer_id, f.name as farmer_name, v.village_name, s.variety_name as seed_variety,
        COALESCE(fm.area_in_vigha, 0) as sown_area, COALESCE(cc.quantity_in_bags, 0) as production_bags,
        COALESCE(cc.final_payment, 0) as total_value, COALESCE(cc.amount_paid, 0) as paid,
        (COALESCE(cc.final_payment, 0) - COALESCE(cc.amount_paid, 0)) as due, cc.status
      FROM crop_cycles cc
      LEFT JOIN farmers f ON cc.farmer_id = f.farmer_id
      LEFT JOIN farms fm ON cc.farm_id = fm.farm_id
      LEFT JOIN villages v ON fm.village_id = v.village_id
      LEFT JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE cc.status IN ('Loaded', 'Paid', 'paid', 'Cleared', 'Marketed') 
      ORDER BY cc.loading_date DESC
    `;
    return result.rows.map((row: any) => ({
      farmer_id: row.farmer_id, farmer_name: row.farmer_name, village_name: row.village_name || 'Unknown', seed_variety: row.seed_variety,
      sown_area_vigha: Number(row.sown_area), production_bags: Number(row.production_bags), total_cycle_value: Number(row.total_value),
      amount_paid: Number(row.paid), amount_due: Number(row.due), status: row.status
    }));
  } catch (error) {
    console.error("getHarvestRegister Error:", error);
    return [];
  }
}

// ==============================================================================
// 3. MUTATIONS
// ==============================================================================

export async function adjustBalance(newBalance: number, reason: string) {
  try {
    await sql`BEGIN`;
    // Create wallet if missing
    const walletCheck = await sql`SELECT balance FROM virtual_wallets WHERE wallet_id = ${WALLET_ID}`;
    if (walletCheck.rowCount === 0) {
        await sql`INSERT INTO virtual_wallets (wallet_id, wallet_name, balance) VALUES (${WALLET_ID}, 'Main Wallet', 0)`;
    }

    const oldRes = await sql`SELECT balance FROM virtual_wallets WHERE wallet_id = ${WALLET_ID}`;
    const diff = newBalance - Number(oldRes.rows[0]?.balance || 0);
    const type = diff >= 0 ? 'CREDIT' : 'DEBIT';

    await sql`UPDATE virtual_wallets SET balance = ${newBalance} WHERE wallet_id = ${WALLET_ID}`;
    await sql`INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description) VALUES (${WALLET_ID}, ${Math.abs(diff)}, ${type}, ${`Manual Adjustment: ${reason}`})`;
    
    await sql`COMMIT`;
    revalidatePath('/admin/finance');
    return { success: true };
  } catch (e) {
    await sql`ROLLBACK`;
    return { success: false };
  }
}

export async function receiveCompanyPayment(companyId: number, amount: number) {
  try {
    await sql`BEGIN`;
    await sql`UPDATE virtual_wallets SET balance = balance + ${amount} WHERE wallet_id = ${WALLET_ID}`;
    await sql`INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description, reference_id) VALUES (${WALLET_ID}, ${amount}, 'CREDIT', 'Payment Received from Company', ${companyId})`;
    await sql`INSERT INTO company_ledger (company_id, transaction_type, amount, description) VALUES (${companyId}, 'CREDIT', ${amount}, 'Payment Received via Finance Hub')`;

    await sql`COMMIT`;
    revalidatePath('/admin/finance');
    return { success: true };
  } catch (e) {
    await sql`ROLLBACK`;
    return { success: false };
  }
}

export async function clearCheque(cycleId: number, chequeIndex: number, amount: number) {
  try {
    await sql`BEGIN`;
    await sql`UPDATE virtual_wallets SET balance = balance - ${amount} WHERE wallet_id = ${WALLET_ID}`;

    const cycleRes = await sql`SELECT cheque_details FROM crop_cycles WHERE crop_cycle_id = ${cycleId}`;
    const cheques = cycleRes.rows[0]?.cheque_details || [];
    if (cheques[chequeIndex]) {
        cheques[chequeIndex].status = 'Cleared';
        cheques[chequeIndex].clearedDate = new Date().toISOString();
    }
    const allCleared = cheques.every((c: any) => c.status === 'Cleared');
    
    if(allCleared) {
         await sql`UPDATE crop_cycles SET cheque_details = ${JSON.stringify(cheques)}::jsonb, status = 'Cleared', is_farmer_paid = TRUE, payment_cleared_date = NOW() WHERE crop_cycle_id = ${cycleId}`;
    } else {
         await sql`UPDATE crop_cycles SET cheque_details = ${JSON.stringify(cheques)}::jsonb WHERE crop_cycle_id = ${cycleId}`;
    }

    await sql`INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description, reference_id) VALUES (${WALLET_ID}, ${amount}, 'DEBIT', ${`Cleared Cheque #${cycleId}`}, ${cycleId})`;

    await sql`COMMIT`;
    revalidatePath('/admin/finance');
    return { success: true };
  } catch (e) {
    await sql`ROLLBACK`;
    return { success: false };
  }
}

export async function refreshModalData(): Promise<FinanceData> {
    // Re-run the main fetcher logic to get fresh DB state
    const data = await getFinanceDashboardData();
    return data;
}