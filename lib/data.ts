// lib/data.ts
import { sql } from '@vercel/postgres';
import { Landmark, SeedVariety, FarmerDetails, BankAccount, Farm, Village } from './definitions';

/**
 * Fetches a list of all villages from the database.
 */
export async function getVillages(): Promise<Village[]> {
  try {
    const data = await sql<Village>`SELECT * FROM villages ORDER BY village_name ASC`;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch villages.');
  }
}

export async function getLandmarks(): Promise<Landmark[]> {
  try {
    const data = await sql<Landmark>`SELECT * FROM landmarks ORDER BY landmark_name ASC`;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch landmarks.');
  }
}

export async function getSeedVarieties(): Promise<SeedVariety[]> {
  try {
    const data = await sql<SeedVariety>`SELECT seed_id, variety_name FROM seeds ORDER BY variety_name ASC`;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch seed varieties.');
  }
}

// Fetch the seed price for the current year
export async function getCurrentSeedPrice(): Promise<number> {
    try {
        const year = new Date().getFullYear();
        const data = await sql<{ price_per_bag: string | number }>`
            SELECT price_per_bag FROM seed_prices WHERE year = ${year} LIMIT 1
        `;
        
        const price = data.rows[0]?.price_per_bag;
        return Number(price) || 0;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch seed price.');
    }
}

export async function searchFarmers(query: string): Promise<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>[]> {
    try {
        const data = await sql<Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>>`
            SELECT farmer_id, name, mobile_number FROM farmers
            WHERE name ILIKE ${'%' + query + '%'} OR mobile_number ILIKE ${'%' + query + '%'}
            LIMIT 10
        `;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        return []; // Return an empty array on error
    }
}

export async function getFarmerDetails(farmerId: number): Promise<FarmerDetails | null> {
    try {
        const farmerData = await sql<Omit<FarmerDetails, 'bank_accounts' | 'farms'>>`SELECT * FROM farmers WHERE farmer_id = ${farmerId}`;
        
        if (farmerData.rows.length === 0) {
            return null;
        }

        const bankAccountsData = await sql<BankAccount>`SELECT * FROM bank_accounts WHERE farmer_id = ${farmerId}`;
        const farmsData = await sql<Farm>`SELECT * FROM farms WHERE farmer_id = ${farmerId}`;

        return {
            ...farmerData.rows[0],
            bank_accounts: bankAccountsData.rows,
            farms: farmsData.rows
        };

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch complete farmer details.');
    }
}