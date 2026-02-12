export const dynamic = 'force-dynamic';

import { sql } from '@vercel/postgres';
import DashboardClient from './DashboardClient';
import { getPendingSamples } from '@/src/app/employee/actions/sample';
import { getPendingWeighing } from '@/src/app/employee/actions/weigh';
import { getActiveShipments, getShipmentMasterData } from '@/src/app/employee/actions/shipments';

// 1. Import the strict types we defined in the tabs
import { SampleTabItem } from '@/src/components/employee/tabs/SampleTab';
import { WeighingItem } from '@/src/components/employee/tabs/WeighingTab';
import { MasterData } from '@/src/components/employee/loading/NewShipmentModal';

const CURRENT_USER_ID = 10; // Hardcoded for now

async function getUserDefaultLocation() {
  try {
    const result = await sql`
      SELECT default_location FROM users WHERE user_id = ${CURRENT_USER_ID}
    `;
    return result.rows[0]?.default_location || 'Farm';
  } catch (error) {
    console.error('Failed to fetch default location:', error);
    return 'Farm';
  }
}

export default async function Page() {
  // 2. Fetch all data in parallel
  // Note: These actions return 'any' or 'QueryResultRow[]', which causes the type mismatch
  const [initialLocation, rawSamples, rawWeighings, shipments, rawMasterData] = await Promise.all([
    getUserDefaultLocation(),
    getPendingSamples(),
    getPendingWeighing(),
    getActiveShipments(),
    getShipmentMasterData()
  ]);

  // 3. CAST the raw data to our strict types
  // We use 'as unknown as Type[]' to safely tell TypeScript "Trust us, the DB shape matches"
  const samples = rawSamples as unknown as SampleTabItem[];
  const weighings = rawWeighings as unknown as WeighingItem[];
  const masterData = rawMasterData as unknown as MasterData;

  return (
    <DashboardClient 
      initialLocation={initialLocation} 
      initialSamples={samples}
      initialWeighings={weighings}
      initialShipments={shipments}
      masterData={masterData} 
    />
  );
}