import { getFarmerDetails } from '@/src/lib/data';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Type it as a Promise
) {
  // 2. Await the params before using them
  const { id } = await params; 
  const farmerId = Number(id);

  if (isNaN(farmerId)) {
    return NextResponse.json({ error: 'Invalid farmer ID' }, { status: 400 });
  }

  try {
    const farmerDetails = await getFarmerDetails(farmerId);
    if (!farmerDetails) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }
    return NextResponse.json(farmerDetails);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch farmer details' }, { status: 500 });
  }
}