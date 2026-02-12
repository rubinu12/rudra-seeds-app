// app/admin/cycles/new/page.tsx
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { getLandmarks, getSeedVarieties, getCurrentSeedPrice, getVillages } from '@/src/lib/data';
import { NewCycleForm } from './NewCycleForm';
import { Loader2 } from 'lucide-react';

// 2. Create a Fallback Component (What shows while reading URL)
function FormFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-bold">Loading Form...</p>
      </div>
    </div>
  );
}

export default async function NewCyclePage() {
  console.log('[SERVER] Fetching initial data for New Cycle page...');

  // Fetch all required data on the server, now including villages.
  const [landmarks, seedVarieties, initialSeedPrice, villages] = await Promise.all([
    getLandmarks(),
    getSeedVarieties(),
    getCurrentSeedPrice(),
    getVillages(),
  ]);

  console.log(`[SERVER] Data fetched. Rendering client form with ${villages.length} villages.`);

  return (
    // === ADDED Wrapper Div with Padding ===
    <div className="p-6 md:p-8"> {/* Adjust padding values (p-6, p-8) as needed */}
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-normal text-on-surface">
          Start a New Sowing Cycle
        </h1>
        <p className="text-on-surface-variant mt-1">
          Add a new farmer or enable search to find an existing one.
        </p>
      </header>
      <Suspense fallback={<FormFallback />}>
      <NewCycleForm
        landmarks={landmarks}
        seedVarieties={seedVarieties}
        villages={villages}
        initialSeedPrice={initialSeedPrice}
      />
      </Suspense>
    </div> // === Closing Wrapper Div ===
  );
}