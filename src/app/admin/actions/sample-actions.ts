"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { z } from "zod";

export type CycleForSampleEntry = {
  crop_cycle_id: number;
  farmer_name: string;
  seed_variety: string;
  sample_collection_date: string | null;
};

const SampleDataSchema = z.object({
  cropCycleId: z.coerce.number().gt(0),
  moisture: z.coerce.number().min(0),
  purity: z.coerce.number().min(0),
  dust: z.coerce.number().min(0),
  colors: z.string().min(1),
  non_seed: z.string().min(1),
  remarks: z.string().optional().nullable(),
  temporary_price_per_man: z.coerce.number().min(0).optional().nullable(),
});

export async function getCyclesPendingSampleEntry(): Promise<
  CycleForSampleEntry[]
> {
  noStore();
  try {
    const result = await sql`
      SELECT
        cc.crop_cycle_id, 
        f.name as farmer_name, 
        s.variety_name as seed_variety,
        cc.sample_collection_date::text
      FROM crop_cycles cc
      JOIN farmers f ON cc.farmer_id = f.farmer_id 
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE cc.status = 'Sample Collected' 
      ORDER BY cc.sample_collection_date ASC
      LIMIT 100;
    `;
    return result.rows as CycleForSampleEntry[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function submitAdminSampleData(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = SampleDataSchema.safeParse({
    ...rawData,
    temporary_price_per_man:
      rawData.temporary_price_per_man === ""
        ? null
        : rawData.temporary_price_per_man,
  });

  if (!validatedFields.success)
    return { success: false, message: "Invalid fields." };

  const data = validatedFields.data;
  const nextStatus =
    data.temporary_price_per_man && data.temporary_price_per_man > 0
      ? "Price Proposed"
      : "Sampled";

  try {
    await sql`
      UPDATE crop_cycles
      SET
        status = ${nextStatus},
        sampling_date = NOW(),
        sample_moisture = ${data.moisture},
        sample_purity = ${data.purity},
        dust_percentage = ${data.dust},
        color_grade = ${data.colors},
        sample_non_seed = ${data.non_seed},
        sample_remarks = ${data.remarks},
        temporary_price_per_man = ${data.temporary_price_per_man}
      WHERE crop_cycle_id = ${data.cropCycleId};
    `;
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (_error) {
    return { success: false, message: "DB Error." };
  }
}