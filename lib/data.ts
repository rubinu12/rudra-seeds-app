// lib/data.ts
import { sql } from '@vercel/postgres';
import { Landmark, SeedVariety, FarmerDetails, BankAccount, Farm } from './definitions';

// Fetch all landmarks for the dropdown
export async function getLandmarks(): Promise<Landmark[]> {
  try {
    const data = await sql<Landmark>`SELECT * FROM landmarks ORDER BY landmark_name ASC`;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch landmarks.');
  }
}

// Fetch all seed varieties for the dropdown
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
        // FIX: Changed 'price' to 'price_per_bag' to match the database schema.
        const data = await sql<{ price_per_bag: number }>`
            SELECT price_per_bag FROM seed_prices WHERE year = ${year} LIMIT 1
        `;
        // FIX: Updated the return value to use the correct column name.
        return data.rows[0]?.price_per_bag || 0;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch seed price.');
    }
}

// Search for farmers by name or mobile (for autocomplete)
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

// Fetch all details for a single farmer after they are selected from the search
export async function getFarmerDetails(farmerId: number): Promise<FarmerDetails | null> {
    try {
        // Fetch the main farmer record
        const farmerData = await sql<Omit<FarmerDetails, 'bank_accounts' | 'farms'>>`SELECT * FROM farmers WHERE farmer_id = ${farmerId}`;
        
        if (farmerData.rows.length === 0) {
            return null; // Farmer not found
        }

        // Fetch their associated bank accounts
        const bankAccountsData = await sql<BankAccount>`SELECT * FROM bank_accounts WHERE farmer_id = ${farmerId}`;
        
        // Fetch their associated farms
        const farmsData = await sql<Farm>`SELECT * FROM farms WHERE farmer_id = ${farmerId}`;

        // Combine all the data into one object
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