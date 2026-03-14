"use server";

import { sql } from "@vercel/postgres";

export async function getHarvestProgress(year: number) {
  try {
    const res = await sql`
      SELECT
        COALESCE(SUM(seed_bags_purchased), 0) as total_bags,
        COALESCE(SUM(seed_bags_purchased) FILTER (WHERE status = 'Growing' OR status = 'growing'), 0) as growing_bags
      FROM crop_cycles
      WHERE crop_cycle_year = ${year} AND status != 'Cancelled'
    `;

    const totalBags = Number(res.rows[0].total_bags);
    const growingBags = Number(res.rows[0].growing_bags); // Untouched bags

    const totalArea = totalBags * 2;
    const untouchedArea = growingBags * 2;
    const workDoneArea = totalArea - untouchedArea;
    
    const progressPercentage = totalArea > 0 ? Math.round((workDoneArea / totalArea) * 100) : 0;

    return {
      totalArea,
      untouchedArea,
      workDoneArea,
      progressPercentage
    };
  } catch (e) {
    console.error("Progress fetch error", e);
    return { totalArea: 0, untouchedArea: 0, workDoneArea: 0, progressPercentage: 0 };
  }
}