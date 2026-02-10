"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

/**
 * Sets the temporary price for a cycle and moves status to 'Price Proposed'
 */
export async function setTemporaryPrice(cycleId: number, price: number) {
  try {
    await sql`
      UPDATE crop_cycles 
      SET 
        temporary_price_per_man = ${price},
        status = 'Price Proposed',
        pricing_date = NOW()
      WHERE crop_cycle_id = ${cycleId}
    `;
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error setting temp price:", error);
    return { success: false, error: "Database update failed" };
  }
}

/**
 * Finalizes the price and moves status to 'Priced'
 */
export async function verifyAndFinalizePrice(
  cycleId: number,
  finalPrice: number
) {
  try {
    await sql`
      UPDATE crop_cycles 
      SET 
        purchase_rate = ${finalPrice},
        status = 'Priced',
        pricing_date = NOW()
      WHERE crop_cycle_id = ${cycleId}
    `;
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error verifying price:", error);
    return { success: false, error: "Verification failed" };
  }
}
