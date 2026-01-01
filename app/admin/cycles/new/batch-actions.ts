// app/admin/cycles/new/batch-actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

// --- SHARED LOGIC FROM OLD ACTION FILE ---
function getSeason(date: Date): string {
    const month = date.getMonth(); // 0 (Jan) to 11 (Dec)
    const year = date.getFullYear();
    // Logic matched from your previous file
    if (month >= 9 && month <= 11) return `Rabi${year}`;
    if (month >= 5 && month <= 8) return `Kharif${year}`;
    return `Zaid${year}`;
}

export type QueuedCycle = {
    tempId: string;
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
    newBankAccounts: { name: string; number: string; ifsc: string; bankName: string }[];
    seedId: string;
    bags: number;
    sowingDate: string;
    goodsCollectionMethod: string;
    paymentChoice: 'Paid' | 'Credit' | 'Partial';
    amountPaid: number;
    totalCost: number;
};

export async function bulkCreateCycles(cycles: QueuedCycle[]) {
    if (!cycles || cycles.length === 0) {
        return { success: false, message: "No data to upload." };
    }

    let successCount = 0;
    const errors: string[] = [];

    // Loop through each item in the queue
    for (const cycle of cycles) {
        try {
            // 1. FARMER: Use Existing ID or Create New
            let currentFarmerId = cycle.farmerId ? Number(cycle.farmerId) : null;
            if (!currentFarmerId) {
                const newFarmer = await sql`
                    INSERT INTO farmers (name, mobile_number, aadhar_number, home_address)
                    VALUES (${cycle.farmerName}, ${cycle.mobileNumber}, ${cycle.aadharNumber}, ${cycle.homeAddress})
                    RETURNING farmer_id`;
                currentFarmerId = newFarmer.rows[0].farmer_id;
            }

            // 2. FARM: Use Existing ID or Create New
            let currentFarmId = cycle.farmId ? Number(cycle.farmId) : null;
            if (!currentFarmId && currentFarmerId) {
                const newFarm = await sql`
                    INSERT INTO farms (farmer_id, location_name, area_in_vigha, landmark_id, village_id)
                    VALUES (${currentFarmerId}, ${cycle.locationName}, ${cycle.areaInVigha}, ${Number(cycle.landmarkId)}, ${Number(cycle.villageId)})
                    RETURNING farm_id`;
                currentFarmId = newFarm.rows[0].farm_id;
            }

            // 3. BANK ACCOUNTS: Merge Selected + New
            const finalAccountIds: string[] = [...cycle.selectedAccountIds];
            if (cycle.newBankAccounts.length > 0 && currentFarmerId) {
                for (const acc of cycle.newBankAccounts) {
                    if (acc.name && acc.number) {
                        const newAcc = await sql`
                            INSERT INTO bank_accounts (farmer_id, account_name, account_no, ifsc_code, bank_name)
                            VALUES (${currentFarmerId}, ${acc.name}, ${acc.number}, ${acc.ifsc}, ${acc.bankName})
                            RETURNING account_id`;
                        finalAccountIds.push(String(newAcc.rows[0].account_id));
                    }
                }
            }

            // 4. PAYMENT LOGIC (Merged from old actions.ts)
            let finalAmountPaid = 0;
            let finalPaymentStatus = 'Credit';

            if (cycle.paymentChoice === 'Paid') {
                finalAmountPaid = cycle.totalCost;
                finalPaymentStatus = 'Paid';
            } else if (cycle.paymentChoice === 'Partial') {
                finalAmountPaid = cycle.amountPaid;
                // Smart Status Calculation
                if (finalAmountPaid <= 0) finalPaymentStatus = 'Credit';
                else if (finalAmountPaid >= cycle.totalCost) finalPaymentStatus = 'Paid';
                else finalPaymentStatus = 'Partial';
            }

            const amountRemaining = cycle.totalCost - finalAmountPaid;
            const sowingDate = cycle.sowingDate; // e.g., "2026-06-15"
            const season = getSeason(new Date(sowingDate));
            const year = new Date(sowingDate).getFullYear();

            // 5. FINAL INSERT
            await sql`
                INSERT INTO crop_cycles (
                    farmer_id, farm_id, seed_id, sowing_date, seed_bags_purchased,
                    seed_cost, seed_payment_status, crop_cycle_year, goods_collection_method,
                    bank_accounts, season, amount_paid, amount_remaining
                )
                VALUES (
                    ${currentFarmerId}, ${currentFarmId}, ${Number(cycle.seedId)}, ${sowingDate},
                    ${cycle.bags}, ${cycle.totalCost}, ${finalPaymentStatus},
                    ${year}, ${cycle.goodsCollectionMethod},
                    ${JSON.stringify(finalAccountIds)}, ${season}, ${finalAmountPaid}, ${amountRemaining}
                )
            `;

            successCount++;

        } catch (innerError: any) {
            console.error(`Failed to save cycle for ${cycle.farmerName}:`, innerError);
            errors.push(`${cycle.farmerName}: ${innerError.message}`);
        }
    }

    // Return results to UI
    if (errors.length > 0) {
        return {
            success: false, 
            message: `Uploaded ${successCount} cycles. Failed: ${errors.join('; ')}`
        };
    }

    revalidatePath('/admin/dashboard');
    return { success: true, message: `Successfully uploaded all ${successCount} entries!` };
}