// app/admin/cycles/test/actions.ts
"use server";

import { sql } from '@vercel/postgres';

type FormState = { message: string; };

export async function createTestCycle(prevState: FormState, formData: FormData): Promise<FormState> {
  const startTime = Date.now();
  console.log(`\n--- [SERVER ACTION STARTED] Timestamp: ${startTime} ---`);

  try {
    const rawFormData = {
      landmark_id: formData.get('landmark_id'),
      seed_id: formData.get('seed_id'),
    };
    console.log('[SERVER ACTION] Received raw form data:', rawFormData);

    const landmarkId = Number(rawFormData.landmark_id);
    const seedId = Number(rawFormData.seed_id);

    if (!landmarkId || !seedId) {
      console.log('[SERVER ACTION] Validation failed: Missing landmark or seed ID.');
      return { message: 'Error: Please select both a landmark and a seed variety.' };
    }
    console.log(`[SERVER ACTION] Parsed IDs: landmarkId=${landmarkId}, seedId=${seedId}`);

    const dummyFarmerId = 1;
    const dummyFarmId = 1;
    const dummySowingDate = new Date().toISOString();
    const dummySeason = 'Test Season 2025';

    console.log('[SERVER ACTION] Preparing to execute SQL INSERT...');
    
    await sql`
      INSERT INTO crop_cycles (farmer_id, farm_id, landmark_id, seed_id, sowing_date, season, seed_payment_status)
      VALUES (${dummyFarmerId}, ${dummyFarmId}, ${landmarkId}, ${seedId}, ${dummySowingDate}, ${dummySeason}, 'Paid')
    `;

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[SERVER ACTION] SQL Execution Successful. Duration: ${duration}ms`);
    console.log(`--- [SERVER ACTION FINISHED] Timestamp: ${endTime} ---\n`);
    
    return { message: `Test cycle created successfully in ${duration}ms!` };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`--- [SERVER ACTION FAILED] Duration: ${duration}ms ---`);
    console.error('[SERVER ACTION] Full error object:', error);
    console.log(`--- [SERVER ACTION FINISHED WITH ERROR] Timestamp: ${endTime} ---\n`);

    return { message: `Database transaction failed. Check server logs for details.` };
  }
}