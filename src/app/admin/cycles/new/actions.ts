// app/admin/cycles/new/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type FormState = { message: string; success: boolean; };

function getSeason(date: Date): string {
    const month = date.getMonth(); // 0 (Jan) to 11 (Dec)
    const year = date.getFullYear();
    if (month >= 9 && month <= 11) return `Rabi${year}`;
    if (month >= 5 && month <= 8) return `Kharif${year}`;
    return `Zaid${year}`;
}

export async function createOrUpdateCycle(_prevState: FormState, formData: FormData): Promise<FormState> {
  let farmerId = formData.get('farmer_id') ? Number(formData.get('farmer_id')) : null;
  let farmId = formData.get('farm_id') ? Number(formData.get('farm_id')) : null;

  const existingAccountIdsJSON = formData.get('bank_account_ids') as string;
  const finalAccountIds = existingAccountIdsJSON ? JSON.parse(existingAccountIdsJSON) : [];

  const newBankAccountsJSON = formData.get('new_bank_accounts') as string;
  const newBankAccounts = newBankAccountsJSON ? JSON.parse(newBankAccountsJSON) : [];

  try {
    if (!farmerId) {
      const farmerData = {
          name: formData.get('farmer_name') as string,
          mobile_number: formData.get('mobile_number') as string,
          aadhar_number: formData.get('aadhar_number') as string,
          home_address: formData.get('home_address') as string,
      };
      const result = await sql`
        INSERT INTO farmers (name, mobile_number, aadhar_number, home_address)
        VALUES (${farmerData.name}, ${farmerData.mobile_number}, ${farmerData.aadhar_number}, ${farmerData.home_address})
        RETURNING farmer_id`;
      farmerId = result.rows[0].farmer_id;
    }

    if (farmerId && !farmId) {
        const farmData = {
            location_name: formData.get('farm_address') as string,
            area_in_vigha: Number(formData.get('area_in_vigha')),
            village_id: Number(formData.get('village_id'))
        };
        const farmResult = await sql`
            INSERT INTO farms (farmer_id, location_name, area_in_vigha, landmark_id, village_id)
            VALUES (${farmerId}, ${farmData.location_name}, ${farmData.area_in_vigha}, ${Number(formData.get('landmark_id'))}, ${farmData.village_id})
            RETURNING farm_id`;
        farmId = farmResult.rows[0].farm_id;
    }

    if (farmerId && newBankAccounts.length > 0) {
      for (const account of newBankAccounts) {
        if (account.name && account.number && account.ifsc) {
          const newAccountResult = await sql`
            INSERT INTO bank_accounts (farmer_id, account_name, account_no, ifsc_code, bank_name)
            VALUES (${farmerId}, ${account.name}, ${account.number}, ${account.ifsc}, ${account.bankName})
            RETURNING account_id`;
          finalAccountIds.push(String(newAccountResult.rows[0].account_id));
        }
      }
    }

    const paymentChoice = formData.get('payment_choice') as string;
    const totalCost = Number(formData.get('total_cost'));
    const amountPaidInput = Number(formData.get('amount_paid'));

    let finalAmountPaid = 0;
    let finalPaymentStatus = '';

    if (paymentChoice === 'Paid') {
        finalAmountPaid = totalCost;
        finalPaymentStatus = 'Paid';
    } else if (paymentChoice === 'Credit') {
        finalAmountPaid = 0;
        finalPaymentStatus = 'Credit';
    } else if (paymentChoice === 'Partial') {
        finalAmountPaid = amountPaidInput;
        if (finalAmountPaid <= 0) {
            finalPaymentStatus = 'Credit';
        } else if (finalAmountPaid >= totalCost) {
            finalPaymentStatus = 'Paid';
        } else {
            finalPaymentStatus = 'Partial';
        }
    }

    const amountRemaining = totalCost - finalAmountPaid;
    const sowingDate = formData.get('sowing_date') as string;
    const season = getSeason(new Date(sowingDate));

    const cycleData = {
      seed_id: Number(formData.get('seed_id')),
      sowing_date: sowingDate,
      seed_bags_purchased: Number(formData.get('seed_bags_purchased')),
      seed_cost: totalCost,
      goods_collection_method: formData.get('goods_collection_method') as string,
      crop_cycle_year: new Date(sowingDate).getFullYear()
    };

    await sql`
        INSERT INTO crop_cycles (
            farmer_id, farm_id, seed_id, sowing_date, seed_bags_purchased,
            seed_cost, seed_payment_status, crop_cycle_year, goods_collection_method,
            bank_accounts, season, amount_paid, amount_remaining
        )
        VALUES (
            ${farmerId}, ${farmId}, ${cycleData.seed_id}, ${cycleData.sowing_date},
            ${cycleData.seed_bags_purchased}, ${cycleData.seed_cost}, ${finalPaymentStatus},
            ${cycleData.crop_cycle_year}, ${cycleData.goods_collection_method},
            ${JSON.stringify(finalAccountIds)}, ${season}, ${finalAmountPaid}, ${amountRemaining}
        )`;

  } catch (error: unknown) {
    // Correctly handle unknown error type
    const message = error instanceof Error ? error.message : "Unknown Error";
    console.error('Database Error:', message);
    return { message: `Database Error: ${message}`, success: false };
  }

  revalidatePath('/admin/dashboard'); 
  revalidatePath('/admin/cycles/new'); 
  redirect('/admin/cycles/new'); 
}