"use server";

import { sql } from '@vercel/postgres';

// ⚠️ REPLACE '1' WITH YOUR ACTUAL ID FROM STEP 1
const CURRENT_USER_ID = 10; 

export async function saveDefaultLocation(location: string) {
    try {
        console.log(`💾 Saving Default: ${location} for User ${CURRENT_USER_ID}`);
        
        const result = await sql`
            UPDATE users 
            SET default_location = ${location} 
            WHERE user_id = ${CURRENT_USER_ID}
        `;
        
        return { success: (result.rowCount ?? 0) > 0 };
    } catch (e: any) {
        console.error("Save Failed:", e.message);
        return { success: false };
    }
}

export async function getDefaultLocation() {
    try {
        const result = await sql`
            SELECT default_location FROM users WHERE user_id = ${CURRENT_USER_ID}
        `;
        return result.rows[0]?.default_location; 
    } catch (e) {
        return null;
    }
}