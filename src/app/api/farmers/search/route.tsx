// app/api/farmers/search/route.ts
import { searchFarmers } from '@/src/lib/data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const farmers = await searchFarmers(query);
    return NextResponse.json(farmers);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to search for farmers' }, { status: 500 });
  }
}