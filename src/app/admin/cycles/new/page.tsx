// app/admin/cycles/new/page.tsx
import { getLandmarks, getSeedVarieties, getCurrentSeedPrice, getVillages } from '@/src/lib/data';
import { NewCycleForm } from './NewCycleForm';

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
      <NewCycleForm
        landmarks={landmarks}
        seedVarieties={seedVarieties}
        villages={villages}
        initialSeedPrice={initialSeedPrice}
      />
    </div> // === Closing Wrapper Div ===
  );
}