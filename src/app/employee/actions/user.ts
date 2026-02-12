"use server";

import { sql } from '@vercel/postgres';
import { auth } from "@/auth";

export async function saveDefaultLocation(location: string) {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;

        if (!userId) {
             console.error("Save Default Location: Unauthorized");
             return { success: false };
        }

        console.log(`💾 Saving Default: ${location} for User ${userId}`);
        
        const result = await sql`
            UPDATE users 
            SET default_location = ${location} 
            WHERE user_id = ${userId}
        `;
        
        return { success: (result.rowCount ?? 0) > 0 };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Save Failed:", msg);
        return { success: false };
    }
}

export async function getDefaultLocation() {
    try {
        const session = await auth();
        const userId = session?.user?.id ? Number(session.user.id) : null;
        if (!userId) return null;

        const result = await sql`
            SELECT default_location FROM users WHERE user_id = ${userId}
        `;
        return result.rows[0]?.default_location; 
    } catch (_e) {
        return null;
    }
}