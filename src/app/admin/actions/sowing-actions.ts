"use server";

import { sql } from '@vercel/postgres';
import { Landmark, SeedVariety, Village } from '@/src/lib/definitions';

export async function getSowingInitialData() {
  try {
    const [landmarks, seedVarieties, initialSeedPriceRes, villages] = await Promise.all([
      sql<Landmark>`SELECT * FROM landmarks ORDER BY landmark_name ASC`,
      sql<SeedVariety>`SELECT seed_id, variety_name FROM seeds ORDER BY variety_name ASC`,
      sql`SELECT price_per_bag FROM seed_prices ORDER BY year DESC LIMIT 1`,
      sql<Village>`SELECT * FROM villages ORDER BY village_name ASC`,
    ]);

    return {
      landmarks: landmarks.rows,
      seedVarieties: seedVarieties.rows,
      initialSeedPrice: Number(initialSeedPriceRes.rows[0]?.price_per_bag) || 0,
      villages: villages.rows,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch sowing data.');
  }
}