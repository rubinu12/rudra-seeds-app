"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addFarmer(formData: FormData) {
  const name = formData.get("name") as string;
  const mobile = formData.get("mobile") as string;
  const village = formData.get("village") as string;

  try {
    await sql`
      INSERT INTO farmers (name, mobile_number, village)
      VALUES (${name}, ${mobile}, ${village})
    `;
  } catch (error) {
    console.error("Error adding farmer:", error);
    // The "return" statement that was here has been removed.
  }

  revalidatePath("/");
  redirect("/");
}