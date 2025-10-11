import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
 
export async function GET(request: Request) {
  // Get the search query from the URL (e.g., /api/farmers/search?query=ram)
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // If there's no query, return an error or an empty array
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
 
  try {
    // Query the database for farmers whose names match the query
    // The '%' is a wildcard, so 'ram%' matches 'Ramesh', 'Ram Singh', etc.
    const farmers = await sql`
      SELECT farmer_id, name, village 
      FROM farmers 
      WHERE name ILIKE ${query + '%'};
    `;
    
    // Return the found farmers as a JSON response
    return NextResponse.json({ farmers: farmers.rows }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch farmers' }, { status: 500 });
  }
}