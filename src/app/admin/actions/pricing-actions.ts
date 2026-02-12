"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { z } from "zod";

// --- TYPE DEFINITIONS (Defined Locally to Fix Build Error) ---

export type CycleForPriceApproval = {
  crop_cycle_id: number;
  farmer_name: string;
  seed_variety: string;
  sampling_date: string | null;
  sample_moisture: number | null;
  sample_purity: number | null;
  sample_dust: number | null;
  sample_colors: string | null;
  sample_non_seed: string | null;
  mobile_number?: string | null;
  temporary_price_per_man?: number | null;
};

// FIXED: Defined strictly here to avoid dependency issues
export type CycleForPriceVerification = {
  crop_cycle_id: number;
  farmer_name: string;
  mobile_number: string | null;
  seed_variety: string;
  variety_name?: string; // Added alias
  
  sampling_date: string | null;
  sample_moisture: number | null;
  sample_purity: number | null;
  sample_dust: number | null;
  sample_colors: string | null;
  sample_non_seed: string | null;
  temporary_price_per_man: number | null;
  
  // Extra fields required for Verification UI
  lot_number: string | null;
  village_name: string | null;
  sample_seed_quality: string | null; 
};

const PriceSchema = z.object({
  cropCycleId: z.coerce.number().gt(0),
  price: z.coerce.number().gt(0, "Price must be greater than zero."),
});

// --- DATA FETCHERS ---

export async function getCyclesPendingTempPrice(): Promise<CycleForPriceApproval[]> {
  noStore();
  try {
    const result = await sql`
      SELECT
        cc.crop_cycle_id, f.name as farmer_name, s.variety_name as seed_variety,
        cc.sampling_date::text, cc.sample_moisture, cc.sample_purity,
        cc.dust_percentage as sample_dust, cc.color_grade as sample_colors,
        cc.sample_non_seed, f.mobile_number
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id 
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE cc.status = 'Sampled' 
      ORDER BY cc.sampling_date ASC;
    `;
    return result.rows as CycleForPriceApproval[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getCyclesPendingVerification(): Promise<CycleForPriceVerification[]> {
  noStore();
  try {
    // UPDATED QUERY: Now joins with 'farms' and 'villages' to get the real data
    const result = await sql`
      SELECT
        cc.crop_cycle_id, 
        f.name as farmer_name, 
        f.mobile_number,
        
        -- Both aliases to ensure compatibility
        s.variety_name as seed_variety, 
        s.variety_name as variety_name,

        cc.sampling_date::text,
        cc.sample_moisture, 
        cc.sample_purity, 
        cc.dust_percentage as sample_dust,
        cc.color_grade as sample_colors, 
        cc.sample_non_seed, 
        cc.temporary_price_per_man,
        
        -- Verification Specific Fields
        cc.lot_no as lot_number,
        COALESCE(cc.grading, 'Standard') as sample_seed_quality,
        v.village_name
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id 
      JOIN seeds s ON cc.seed_id = s.seed_id
      LEFT JOIN farms fm ON cc.farm_id = fm.farm_id
      LEFT JOIN villages v ON fm.village_id = v.village_id
      WHERE cc.status = 'Price Proposed' 
      ORDER BY cc.pricing_date ASC;
    `;
    return result.rows as CycleForPriceVerification[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

// --- SERVER ACTIONS ---

export async function submitTemporaryPrice(formData: FormData) {
  const validated = PriceSchema.safeParse({
    cropCycleId: formData.get("cropCycleId"),
    price: formData.get("temporaryPrice"),
  });

  if (!validated.success) return { success: false, message: "Invalid price." };

  try {
    await sql`
      UPDATE crop_cycles
      SET 
        temporary_price_per_man = ${validated.data.price}, 
        status = 'Price Proposed', 
        pricing_date = NOW()
      WHERE crop_cycle_id = ${validated.data.cropCycleId} AND status = 'Sampled';
    `;
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Database Error" };
  }
}

export async function verifyAndFinalizePrice(cropCycleId: number, price: number) {
  if (!cropCycleId || !price || price <= 0) {
      return { success: false, error: "Invalid price or ID" };
  }

  try {
    await sql`
      UPDATE crop_cycles
      SET 
        purchase_rate = ${price}, 
        status = 'Priced', 
        pricing_date = NOW()
      WHERE crop_cycle_id = ${cropCycleId};
    `;
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Verification failed." };
  }
}