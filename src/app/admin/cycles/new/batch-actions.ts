"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

// --- HELPER ---
function getSeason(date: Date): string {
    const month = date.getMonth(); 
    const year = date.getFullYear();
    if (month >= 9 && month <= 11) return `Rabi${year}`;
    if (month >= 5 && month <= 8) return `Kharif${year}`;
    return `Zaid${year}`;
}

// --- TYPES ---
export type BankAccountInput = {
  name: string;
  number: string;
  ifsc: string;
  bankName: string;
};

export type QueuedCycle = {
  tempId: string; // Unique ID for tracking in UI
  farmerId: string | null;
  farmerName: string;
  mobileNumber: string;
  aadharNumber: string;
  homeAddress: string;
  farmId: string | null;
  locationName: string;
  areaInVigha: number;
  villageId: string;
  landmarkId: string;
  selectedAccountIds: string[];
  newBankAccounts: BankAccountInput[];
  seedId: string;
  bags: number;
  sowingDate: string;
  goodsCollectionMethod: string;
  paymentChoice: 'Paid' | 'Credit' | 'Partial';
  amountPaid: number;
  totalCost: number;
  lot_no: string | null;
};

// Result Type for UI
export type BatchItemResult = {
    tempId: string;
    status: 'success' | 'error';
    message?: string;
};

export type BatchResponse = {
    success: boolean;
    results: BatchItemResult[];
    summary: { total: number; success: number; failed: number };
};

// --- MAIN ACTION ---
export async function bulkCreateCycles(queue: QueuedCycle[]): Promise<BatchResponse> {
  if (!queue || queue.length === 0) {
      return { success: false, results: [], summary: { total: 0, success: 0, failed: 0 } };
  }

  const results: BatchItemResult[] = [];
  let successCount = 0;
  let failCount = 0;

  // Process items sequentially so database constraints are respected in order
  for (const item of queue) {
    try {
      // --- CORE LOGIC (Wrapped in Try/Catch per item) ---
      
      // 1. Farmer Logic
      let farmer_id = item.farmerId;
      if (!farmer_id) {
        // Check for duplicates
        const existing = await sql`SELECT farmer_id, name FROM farmers WHERE mobile_number = ${item.mobileNumber}`;
        if (existing.rowCount && existing.rowCount > 0) {
            throw new Error(`Mobile ${item.mobileNumber} exists (${existing.rows[0].name}). Use search.`);
        }
        // Create
        const newFarmer = await sql`
            INSERT INTO farmers (name, mobile_number, aadhar_number, home_address)
            VALUES (${item.farmerName}, ${item.mobileNumber}, ${item.aadharNumber}, ${item.homeAddress})
            RETURNING farmer_id
        `;
        farmer_id = newFarmer.rows[0].farmer_id;
      }

      // 2. Farm Logic
      let farm_id = item.farmId;
      if (!farm_id) {
        const newFarm = await sql`
            INSERT INTO farms (farmer_id, village_id, location_name, area_in_vigha, landmark_id)
            VALUES (${farmer_id}, ${item.villageId}, ${item.locationName}, ${item.areaInVigha}, ${item.landmarkId})
            RETURNING farm_id
        `;
        farm_id = newFarm.rows[0].farm_id;
      }

      // 3. Bank Accounts
      const finalAccountIds: string[] = [...(item.selectedAccountIds || [])];
      if (item.newBankAccounts?.length > 0) {
          for (const acc of item.newBankAccounts) {
              if (acc.name && acc.number) {
                  const newAcc = await sql`
                      INSERT INTO bank_accounts (farmer_id, account_name, account_no, ifsc_code, bank_name)
                      VALUES (${farmer_id}, ${acc.name}, ${acc.number}, ${acc.ifsc}, ${acc.bankName})
                      RETURNING account_id
                  `;
                  finalAccountIds.push(String(newAcc.rows[0].account_id));
              }
          }
      }

      // 4. Calcs
      let finalAmountPaid = 0;
      let finalPaymentStatus = '';
      if (item.paymentChoice === 'Paid') {
          finalAmountPaid = item.totalCost;
          finalPaymentStatus = 'Paid';
      } else if (item.paymentChoice === 'Credit') {
          finalAmountPaid = 0;
          finalPaymentStatus = 'Credit';
      } else if (item.paymentChoice === 'Partial') {
          finalAmountPaid = item.amountPaid;
          if (finalAmountPaid <= 0) finalPaymentStatus = 'Credit';
          else if (finalAmountPaid >= item.totalCost) finalPaymentStatus = 'Paid';
          else finalPaymentStatus = 'Partial';
      }
      const amountRemaining = item.totalCost - finalAmountPaid;
      const sowingDateObj = new Date(item.sowingDate);
      const season = getSeason(sowingDateObj);
      const cropCycleYear = sowingDateObj.getFullYear();

      // 5. Insert Cycle
      const cycleRes = await sql`
        INSERT INTO crop_cycles (
          farmer_id, farm_id, seed_id, sowing_date, status, 
          seed_bags_purchased, goods_collection_method, lot_no,
          seed_cost, seed_payment_status, crop_cycle_year, season,
          amount_paid, amount_remaining, bank_accounts
        )
        VALUES (
          ${farmer_id}, ${farm_id}, ${item.seedId}, ${item.sowingDate}, 'Growing', 
          ${item.bags}, ${item.goodsCollectionMethod}, ${item.lot_no},
          ${item.totalCost}, ${finalPaymentStatus}, ${cropCycleYear}, ${season},
          ${finalAmountPaid}, ${amountRemaining}, ${JSON.stringify(finalAccountIds)}
        )
        RETURNING crop_cycle_id
      `;

      // 6. Wallet
      if (finalAmountPaid > 0) {
          const cycleId = cycleRes.rows[0].crop_cycle_id;
          await sql`
              INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description, reference_id)
              VALUES (1, ${finalAmountPaid}, 'CREDIT', ${`Seed Payment for Cycle #${cycleId}`}, ${cycleId})
          `;
          await sql`UPDATE virtual_wallets SET balance = balance + ${finalAmountPaid} WHERE wallet_id = 1`;
      }

      // SUCCESS FOR THIS ITEM
      results.push({ tempId: item.tempId, status: 'success' });
      successCount++;

    } catch (error) {
      // FAILURE FOR THIS ITEM (But continue loop)
      console.error(`Error processing item ${item.tempId}:`, error);
      results.push({ 
          tempId: item.tempId, 
          status: 'error', 
          message:  "Unknown Database Error" 
      });
      failCount++;
    }
  }

  revalidatePath('/admin/dashboard');
  
  return { 
      success: true, // The BATCH action ran successfully (even if individual items failed)
      results,
      summary: { total: queue.length, success: successCount, failed: failCount }
  };
}