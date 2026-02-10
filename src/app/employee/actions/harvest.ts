"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth"; // Security

export async function markAsHarvested(
  cycleId: number,
  collectionLocation: string
) {
  try {
    // 1. Security Check
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
      return { success: false, message: "Unauthorized: Please login." };
    }

    if (!cycleId) throw new Error("Invalid ID");

    // 2. Update Status & Track Employee
    await sql`
            UPDATE crop_cycles 
            SET 
                status = 'Harvested', 
                harvesting_date = NOW(),
                goods_collection_method = ${collectionLocation},
                harvested_by = ${userId} -- Tracking
            WHERE crop_cycle_id = ${cycleId}
        `;

    revalidatePath("/employee/dashboard");
    return { success: true, message: "Marked as Harvested" };
  } catch (e: any) {
    console.error("Harvest Action Failed:", e.message);
    return { success: false, message: e.message };
  }
}