// app/api/farmers/[id]/details/route.ts
import { getFarmerDetails } from '@/lib/data';
import { NextResponse } from 'next/server';

type Params = {
  id: string;
};

export async function GET(request: Request, context: { params: Params }) {
  const farmerId = Number(context.params.id);

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