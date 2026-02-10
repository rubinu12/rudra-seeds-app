// app/api/cycles/search/route.ts
import { getCycles } from '@/src/lib/growing-data';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define a schema for expected query parameters for validation
const filterSchema = z.object({
  query: z.string().optional(),
  landmarkId: z.coerce.number().optional(),
  excludeCycleId: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    query: searchParams.get('query') || undefined,
    landmarkId: searchParams.get('landmarkId') ? Number(searchParams.get('landmarkId')) : undefined,
    excludeCycleId: searchParams.get('exclude') ? Number(searchParams.get('exclude')) : undefined,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear(),
  };

  // Validate the filters
  const validatedFilters = filterSchema.safeParse(filters);
  if (!validatedFilters.success) {
    return NextResponse.json({ error: 'Invalid filter parameters', details: validatedFilters.error.flatten() }, { status: 400 });
  }

  // If no meaningful filters are provided, return empty array to avoid loading all data
  if (!validatedFilters.data.query && !validatedFilters.data.landmarkId) {
      return NextResponse.json([]);
  }

  try {
    // Call our new universal function with the validated filters
    const cycles = await getCycles(validatedFilters.data);
    return NextResponse.json(cycles);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to search for cycles' }, { status: 500 });
  }
}