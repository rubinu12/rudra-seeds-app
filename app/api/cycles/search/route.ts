// app/api/cycles/search/route.ts
import { searchAllCycles } from '@/lib/growing-data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  // We'll use a default year for now. This can be made dynamic later if needed.
  const year = new Date().getFullYear();

  // If the user has cleared the search bar, the query will be empty.
  // In this case, we should return an empty array.
  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // Call our specific search function with the user's query and the current year.
    const cycles = await searchAllCycles(query, year);
    return NextResponse.json(cycles);
  } catch (error) {
    console.error('API Error:', error);
    // If something goes wrong on the server, send a clear error message.
    return NextResponse.json({ error: 'Failed to search for cycles' }, { status: 500 });
  }
}