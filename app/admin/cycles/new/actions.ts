// src/app/admin/cycles/new/actions.ts
"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Define a type for the return state
type FormState = {
  message: string;
  success: boolean;
};

// This is a complex action that handles multiple database operations
export async function createOrUpdateCycle(prevState: FormState, formData: FormData): Promise<FormState> {
  let farmerId = Number(formData.get('farmer_id'));
  let farmId = Number(formData.get('farm_id'));
  let accountId = Number(formData.get('account_id'));
  
  try {
    // ==== Step 1: Handle Farmer Data (Create or Update) ====
    const farmerData = {
      name: formData.get('farmer_name') as string,
      mobile_number: formData.get('mobile_number') as string,
      village: formData.get('village') as string,
      aadhar_number: formData.get('aadhar_number') as string,
      home_address: formData.get('home_address') as string,
    };

    if (farmerId) {
      // Update existing farmer
      await sql`
        UPDATE farmers
        SET name = ${farmerData.name}, mobile_number = ${farmerData.mobile_number}, village = ${farmerData.village}, aadhar_number = ${farmerData.aadhar_number}, home_address = ${farmerData.home_address}, updated_at = NOW()
        WHERE farmer_id = ${farmerId}
      `;
    } else {
      // Insert new farmer and get their ID
      const result = await sql`
        INSERT INTO farmers (name, mobile_number, village, aadhar_number, home_address, created_at, updated_at)
        VALUES (${farmerData.name}, ${farmerData.mobile_number}, ${farmerData.village}, ${farmerData.aadhar_number}, ${farmerData.home_address}, NOW(), NOW())
        RETURNING farmer_id;
      `;
      farmerId = result.rows[0].farmer_id;
    }

    // ==== Step 2: Handle Bank Account (Create if new) ====
    if (!accountId && formData.get('account_no')) {
        const bankData = {
            account_name: formData.get('account_name') as string,
            account_no: formData.get('account_no') as string,
            ifsc_code: formData.get('ifsc_code') as string,
        };
        const result = await sql`
            INSERT INTO bank_accounts (farmer_id, account_name, account_no, ifsc_code)
            VALUES (${farmerId}, ${bankData.account_name}, ${bankData.account_no}, ${bankData.ifsc_code})
            RETURNING account_id;
        `;
        accountId = result.rows[0].account_id;
    }

    // ==== Step 3: Handle Farm (Create if new) ====
    if (!farmId && formData.get('location_name')) {
        const farmData = {
            location_name: formData.get('location_name') as string,
            area_in_vigha: Number(formData.get('area_in_vigha')),
            landmark_id: Number(formData.get('landmark_id')),
        };
        const result = await sql`
            INSERT INTO farms (farmer_id, location_name, area_in_vigha, landmark_id)
            VALUES (${farmerId}, ${farmData.location_name}, ${farmData.area_in_vigha}, ${farmData.landmark_id})
            RETURNING farm_id;
        `;
        farmId = result.rows[0].farm_id;
    }

    // ==== Step 4: Create the Crop Cycle ====
    const cycleData = {
      seed_id: Number(formData.get('seed_id')),
      sowing_date: formData.get('sowing_date') as string,
      seed_bags_purchased: Number(formData.get('seed_bags_purchased')),
      seed_cost: Number(formData.get('total_cost')),
      seed_payment_status: formData.get('payment_status') as string,
    };

    await sql`
      INSERT INTO crop_cycles (farmer_id, farm_id, seed_id, sowing_date, seed_bags_purchased, seed_cost, seed_payment_status, season)
      VALUES (${farmerId}, ${farmId}, ${cycleData.seed_id}, ${cycleData.sowing_date}, ${cycleData.seed_bags_purchased}, ${cycleData.seed_cost}, ${cycleData.seed_payment_status}, 'Rabi 2025')
    `;

  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Failed to create crop cycle.', success: false };
  }

  // Revalidate the dashboard path and redirect
  revalidatePath('/admin/dashboard');
  redirect('/admin/dashboard');
  
  // This part is for TypeScript; redirect will stop execution
  return { message: 'Crop cycle created successfully.', success: true };
}