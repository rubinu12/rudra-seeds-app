"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

// --- HELPER: Season Logic ---
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
  tempId: string; // Critical for tracking errors in UI
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
  lot_no: string | null; // Input is still a string (e.g., "L-1, L-2")
};

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

  // Process sequentially to maintain consistency and order
  for (const item of queue) {
    try {
      await sql`BEGIN`; // Start Transaction per item

      // --- 1. Farmer Logic ---
      let farmer_id = item.farmerId;
      if (!farmer_id) {
        // Double check duplicate mobile before insert to give clean error
        const existing = await sql`SELECT name FROM farmers WHERE mobile_number = ${item.mobileNumber}`;
        if (existing.rowCount && existing.rowCount > 0) {
            throw new Error(`Mobile ${item.mobileNumber} is already registered to ${existing.rows[0].name}. Please search and select.`);
        }
        
        const newFarmer = await sql`
            INSERT INTO farmers (name, mobile_number, aadhar_number, home_address)
            VALUES (${item.farmerName}, ${item.mobileNumber}, ${item.aadharNumber}, ${item.homeAddress})
            RETURNING farmer_id
        `;
        farmer_id = newFarmer.rows[0].farmer_id;
      }

      // --- 2. Farm Logic ---
      let farm_id = item.farmId;
      if (!farm_id) {
        const newFarm = await sql`
            INSERT INTO farms (farmer_id, village_id, location_name, area_in_vigha, landmark_id)
            VALUES (${farmer_id}, ${item.villageId}, ${item.locationName}, ${item.areaInVigha}, ${item.landmarkId})
            RETURNING farm_id
        `;
        farm_id = newFarm.rows[0].farm_id;
      }

      // --- 3. Bank Accounts Logic ---
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

      // --- 4. Payment & Date Calculations ---
      let finalAmountPaid = 0;
      let finalPaymentStatus = '';
      
      if (item.paymentChoice === 'Paid') {
          finalAmountPaid = item.totalCost;
          finalPaymentStatus = 'Paid';
      } else if (item.paymentChoice === 'Credit') {
          finalAmountPaid = 0;
          finalPaymentStatus = 'Credit';
      } else if (item.paymentChoice === 'Partial') {
          finalAmountPaid = item.amountPaid || 0;
          if (finalAmountPaid <= 0) finalPaymentStatus = 'Credit';
          else if (finalAmountPaid >= item.totalCost) finalPaymentStatus = 'Paid';
          else finalPaymentStatus = 'Partial';
      }
      
      const amountRemaining = item.totalCost - finalAmountPaid;
      const sowingDateObj = new Date(item.sowingDate);
      const season = getSeason(sowingDateObj);
      const cropCycleYear = sowingDateObj.getFullYear();

      // --- 5. Insert Cycle (REMOVED lot_no column) ---
      const cycleRes = await sql`
        INSERT INTO crop_cycles (
          farmer_id, farm_id, seed_id, sowing_date, status, 
          seed_bags_purchased, goods_collection_method,
          seed_cost, seed_payment_status, crop_cycle_year, season,
          amount_paid, amount_remaining, bank_accounts
        )
        VALUES (
          ${farmer_id}, ${farm_id}, ${item.seedId}, ${item.sowingDate}, 'Growing', 
          ${item.bags}, ${item.goodsCollectionMethod},
          ${item.totalCost}, ${finalPaymentStatus}, ${cropCycleYear}, ${season},
          ${finalAmountPaid}, ${amountRemaining}, ${JSON.stringify(finalAccountIds)}
        )
        RETURNING crop_cycle_id
      `;
      
      const cycleId = cycleRes.rows[0].crop_cycle_id;

      // --- 6. Insert Lots (New Relation Table Logic) ---
      if (item.lot_no && item.lot_no.trim().length > 0) {
          // Parse: "L1, L2" -> ["L1", "L2"]
          const lots = item.lot_no.split(',').map(l => l.trim()).filter(l => l !== "");
          
          for (const lot of lots) {
             await sql`
                INSERT INTO cycle_lots (crop_cycle_id, lot_number)
                VALUES (${cycleId}, ${lot})
             `;
          }
      }

      // --- 7. Wallet Transaction (If Paid) ---
      if (finalAmountPaid > 0) {
          await sql`
              INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description, reference_id)
              VALUES (1, ${finalAmountPaid}, 'CREDIT', ${`Seed Payment for Cycle #${cycleId}`}, ${cycleId})
          `;
          await sql`UPDATE virtual_wallets SET balance = balance + ${finalAmountPaid} WHERE wallet_id = 1`;
      }

      await sql`COMMIT`; // Commit success for this item
      
      results.push({ tempId: item.tempId, status: 'success' });
      successCount++;

    } catch (error: unknown) {
      await sql`ROLLBACK`; // Undo anything for this specific item if it failed

      // Error Message Cleanup
      let msg = "Unknown Database Error";
      if (error instanceof Error) {
          msg = error.message;
          // Beautify common SQL errors if needed
          if (msg.includes("duplicate key")) msg = "Duplicate Data Error (likely Mobile or Aadhar)";
          if (msg.includes("violates foreign key")) msg = "Invalid Selection (Village, Seed, or Landmark not found)";
      }

      console.error(`Error processing item ${item.tempId} (${item.farmerName}):`, msg);
      
      results.push({ 
          tempId: item.tempId, 
          status: 'error', 
          message: msg 
      });
      failCount++;
    }
  }

  revalidatePath('/admin/dashboard');
  
  return { 
      success: true, 
      results,
      summary: { total: queue.length, success: successCount, failed: failCount }
  };
}