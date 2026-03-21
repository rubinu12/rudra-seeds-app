// src/app/admin/actions/harvest-master-actions.ts
'use server';

import { sql } from '@vercel/postgres';

export type HarvestMasterRow = {
  cycleId: number; // <-- ADDED: Explicit ID for AG Grid
  billNo: string;
  variety: string;
  lotNos: string;
  farmerName: string;
  mobileNumber: string;
  bankAccountName: string;
  chequeName: string;
  bags: number;
  weightInMan: number;
  purchaseRate: number;
  amount: number;
  chequeNumbers: string;
  chequeDueDates: string;
  status: string;
};

export async function getHarvestMasterReport(): Promise<HarvestMasterRow[]> {
  const queryText = `
    SELECT 
      cc.crop_cycle_id,
      cc.bill_number,
      s.variety_name,
      (
          SELECT string_agg(cl.lot_number, ', ') 
          FROM cycle_lots cl 
          WHERE cl.crop_cycle_id = cc.crop_cycle_id
      ) AS lot_no,
      f.name as farmer_name,
      f.mobile_number,
      (
          SELECT ba.account_name
          FROM bank_accounts ba 
          WHERE ba.farmer_id = f.farmer_id 
          LIMIT 1
      ) AS bank_account_name,
      cc.quantity_in_bags,
      cc.final_payment,
      cc.purchase_rate,
      cc.status,
      cc.cheque_details
    FROM crop_cycles cc
    LEFT JOIN farmers f ON cc.farmer_id = f.farmer_id
    LEFT JOIN seeds s ON cc.seed_id = s.seed_id
    ORDER BY cc.crop_cycle_id DESC;
  `;

  // --- AUTO-RETRY MECHANISM (Kept completely intact) ---
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      const result = await sql.query(queryText, []);

      return result.rows.map((row) => {
        const bags = Number(row.quantity_in_bags || 0);
        const amount = Number(row.final_payment || 0);
        const weightInMan = (bags * 50) / 20;
        
        const purchaseRate = row.purchase_rate ? Number(row.purchase_rate) : (weightInMan > 0 ? (amount / weightInMan) : 0);

        const cheques: any[] = Array.isArray(row.cheque_details) ? row.cheque_details : [];
        
        const chequeNumbers = cheques
          .map(c => c.cheque_number || c.chequeNo || c.chequeNumber)
          .filter(Boolean)
          .join(', ') || '';

        const chequeDueDates = cheques
          .map(c => c.due_date || c.dueDate)
          .filter(Boolean)
          .join(', ') || '';

        const chequeName = cheques
          .map(c => c.payee_name || c.payeeName)
          .filter(Boolean)
          .join(', ') || (row.farmer_name || 'Unknown');

        return {
          cycleId: Number(row.crop_cycle_id), // <-- ADDED: Map exact ID directly
          billNo: row.bill_number || `BILL-${row.crop_cycle_id}`,
          variety: row.variety_name || 'Unknown',
          lotNos: row.lot_no || '',
          farmerName: row.farmer_name || 'Unknown',
          mobileNumber: row.mobile_number || '',
          bankAccountName: row.bank_account_name || '',
          chequeName: chequeName,
          bags: bags,
          weightInMan: Number(weightInMan.toFixed(2)),
          purchaseRate: Number(purchaseRate.toFixed(2)),
          amount: amount,
          chequeNumbers: chequeNumbers,
          chequeDueDates: chequeDueDates,
          status: row.status || 'Unknown'
        };
      });
      
    } catch (error) {
      lastError = error;
      retries--;
      if (retries > 0) {
          console.warn(`[Neon DB] Connection dropped. Waking up database... Retrying in 1.5s (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1500)); 
      }
    }
  }

  console.error("Harvest Master Report Error after 3 attempts:", lastError);
  throw new Error("Failed to load Harvest Master Data. Please check your internet connection.");
}

// --- INLINE EDITING ACTION (Kept completely intact) ---
export async function updateHarvestInlineField(cycleId: number, field: string, newValue: string) {
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      const cycleRes = await sql`SELECT farmer_id, cheque_details FROM crop_cycles WHERE crop_cycle_id = ${cycleId}`;
      if (cycleRes.rowCount === 0) return { success: false, message: 'Cycle not found.' };
      
      const farmerId = cycleRes.rows[0].farmer_id;
      const cleanValue = newValue ? newValue.trim() : '';

      if (field === 'mobileNumber') {
         await sql`UPDATE farmers SET mobile_number = ${cleanValue} WHERE farmer_id = ${farmerId}`;
      } 
      else if (field === 'bankAccountName') {
         const checkBank = await sql`SELECT 1 FROM bank_accounts WHERE farmer_id = ${farmerId} LIMIT 1`;
         if ((checkBank.rowCount ?? 0) > 0) {
             await sql`UPDATE bank_accounts SET account_name = ${cleanValue} WHERE farmer_id = ${farmerId}`;
         } else {
             return { success: false, message: "Farmer has no bank account on file to edit." };
         }
      } 
      else if (field === 'lotNos') {
         await sql`BEGIN`;
         await sql`DELETE FROM cycle_lots WHERE crop_cycle_id = ${cycleId}`;
         const lots = cleanValue.split(',').map(l => l.trim()).filter(Boolean);
         for (const lot of lots) {
             await sql`INSERT INTO cycle_lots (crop_cycle_id, lot_number) VALUES (${cycleId}, ${lot})`;
         }
         await sql`COMMIT`;
      } 
      else if (field === 'chequeNumbers') {
         const cheques = Array.isArray(cycleRes.rows[0].cheque_details) ? cycleRes.rows[0].cheque_details : [];
         const newNumbers = cleanValue.split(',').map(n => n.trim());
         
         newNumbers.forEach((num, idx) => {
             if (cheques[idx]) {
                 cheques[idx].cheque_number = num;
                 if (cheques[idx].chequeNo) cheques[idx].chequeNo = num;
                 if (cheques[idx].chequeNumber) cheques[idx].chequeNumber = num;
             }
         });
         await sql`UPDATE crop_cycles SET cheque_details = ${JSON.stringify(cheques)}::jsonb WHERE crop_cycle_id = ${cycleId}`;
      } 
      else {
         return { success: false, message: 'Field is not editable.' };
      }

      return { success: true, message: 'Updated successfully.' };
      
    } catch (error: any) {
      lastError = error;
      
      if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
          retries--;
          if (retries > 0) {
              console.warn(`[Neon DB Update] Connection dropped. Retrying in 1s... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
          }
      }
      
      console.error("Inline Update Error:", error);
      return { success: false, message: 'Database error during update.' };
    }
  }

  return { success: false, message: 'Database connection failed after retries.' };
}