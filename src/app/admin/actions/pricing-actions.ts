"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { z } from "zod";

// DEFINE THE TYPE LOCALLY TO FIX BUILD ERROR
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

const PriceSchema = z.object({
  cropCycleId: z.coerce.number().gt(0),
  price: z.coerce.number().gt(0, "Price must be greater than zero."),
});

/**
 * FETCH: Cycles pending Temporary Price (Status: Sampled)
 */
export async function getCyclesPendingTempPrice(): Promise<
  CycleForPriceApproval[]
> {
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

/**
 * FETCH: Cycles pending Final Verification (Status: Price Proposed)
 */
export async function getCyclesPendingVerification(): Promise<
  CycleForPriceApproval[]
> {
  noStore();
  try {
    const result = await sql`
      SELECT
        cc.crop_cycle_id, f.name as farmer_name, f.mobile_number,
        s.variety_name as seed_variety, cc.sampling_date::text,
        cc.sample_moisture, cc.sample_purity, cc.dust_percentage as sample_dust,
        cc.color_grade as sample_colors, cc.sample_non_seed, cc.temporary_price_per_man
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id 
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE cc.status = 'Price Proposed' 
      ORDER BY cc.pricing_date ASC;
    `;
    return result.rows as CycleForPriceApproval[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

/**
 * ACTION: Propose Temporary Price
 */
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

/**
 * ACTION: Finalize/Verify Price
 */
export async function verifyAndFinalizePrice(formData: FormData) {
  const validated = PriceSchema.safeParse({
    cropCycleId: formData.get("cropCycleId"),
    price: formData.get("finalPrice"),
  });

  if (!validated.success)
    return { success: false, message: "Invalid final price." };

  try {
    await sql`
      UPDATE crop_cycles
      SET 
        purchase_rate = ${validated.data.price}, 
        status = 'Priced', 
        pricing_date = NOW()
      WHERE crop_cycle_id = ${validated.data.cropCycleId};
    `;
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Verification failed." };
  }
}
