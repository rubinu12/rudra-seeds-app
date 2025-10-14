// app/admin/cycles/new/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type FormState = { message: string; success: boolean; };

export async function createOrUpdateCycle(prevState: FormState, formData: FormData): Promise<FormState> {
  let farmerId = formData.get('farmer_id') ? Number(formData.get('farmer_id')) : null;
  let accountId = formData.get('account_id') ? Number(formData.get('account_id')) : null;
  let farmId = formData.get('farm_id') ? Number(formData.get('farm_id')) : null;

  try {
    const farmerData = { name: formData.get('farmer_name') as string, mobile_number: formData.get('mobile_number') as string, village: formData.get('village') as string, aadhar_number: formData.get('aadhar_number') as string, home_address: formData.get('home_address') as string, };
    if (farmerId) {
      await sql`UPDATE farmers SET name = ${farmerData.name}, mobile_number = ${farmerData.mobile_number}, village = ${farmerData.village}, aadhar_number = ${farmerData.aadhar_number}, home_address = ${farmerData.home_address} WHERE farmer_id = ${farmerId}`;
    } else {
      const result = await sql`INSERT INTO farmers (name, mobile_number, village, aadhar_number, home_address) VALUES (${farmerData.name}, ${farmerData.mobile_number}, ${farmerData.village}, ${farmerData.aadhar_number}, ${farmerData.home_address}) RETURNING farmer_id`;
      farmerId = result.rows[0].farmer_id;
    }

    if (!accountId) {
        const bankData = { account_name: formData.get('account_name') as string, account_no: formData.get('account_no') as string, ifsc_code: formData.get('ifsc_code') as string, bank_name: formData.get('bank_name') as string };
        await sql`INSERT INTO bank_accounts (farmer_id, account_name, account_no, ifsc_code, bank_name) VALUES (${farmerId}, ${bankData.account_name}, ${bankData.account_no}, ${bankData.ifsc_code}, ${bankData.bank_name})`;
    }

    if (!farmId) {
        const farmData = { location_name: formData.get('farm_address') as string, area_in_vigha: Number(formData.get('area_in_vigha')) };
        const farmResult = await sql`INSERT INTO farms (farmer_id, location_name, area_in_vigha, landmark_id) VALUES (${farmerId}, ${farmData.location_name}, ${farmData.area_in_vigha}, ${Number(formData.get('landmark_id'))}) RETURNING farm_id`;
        farmId = farmResult.rows[0].farm_id;
    }

    const cycleData = {
      seed_id: Number(formData.get('seed_id')), sowing_date: formData.get('sowing_date') as string,
      seed_bags_purchased: Number(formData.get('seed_bags_purchased')), seed_cost: Number(formData.get('total_cost')),
      seed_payment_status: formData.get('payment_status') as string, goods_collection_method: formData.get('goods_collection_method') as string,
    };
    await sql`INSERT INTO crop_cycles (farmer_id, farm_id, seed_id, sowing_date, seed_bags_purchased, seed_cost, seed_payment_status, season, goods_collection_method) VALUES (${farmerId}, ${farmId}, ${cycleData.seed_id}, ${cycleData.sowing_date}, ${cycleData.seed_bags_purchased}, ${cycleData.seed_cost}, ${cycleData.seed_payment_status}, 'Rabi 2025', ${cycleData.goods_collection_method})`;

  } catch (error: any) {
    console.error('Database Error:', error);
    return { message: `Database Error: ${error.message}`, success: false };
  }

  revalidatePath('/admin/dashboard');
  redirect('/admin/dashboard');
}