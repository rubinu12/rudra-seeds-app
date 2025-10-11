import { sql } from '@vercel/postgres';

// Define the type for a single farmer for TypeScript
export type Farmer = {
  farmer_id: number;
  name: string;
  village: string;
  mobile_number: string;
};

// Create an async function to fetch all farmers
export async function getFarmers() {
  try {
    const data = await sql<Farmer>`SELECT farmer_id, name, village, mobile_number FROM farmers`;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch farmer data.');
  }
}