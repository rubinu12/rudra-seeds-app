// app/admin/cycles/new/page.tsx
import { getLandmarks, getSeedVarieties, getCurrentSeedPrice } from '@/lib/data';
import { NewCycleForm } from './NewCycleForm'; // Our new smart parent component

// This Server Component pre-fetches all necessary data for the form.
export default async function NewCyclePage() {
  console.log('[SERVER] Fetching initial data for New Cycle page...');
  
  // Fetch all required data on the server in parallel for maximum speed.
  const [landmarks, seedVarieties, initialSeedPrice] = await Promise.all([
    getLandmarks(),
    getSeedVarieties(),
    getCurrentSeedPrice(),
  ]);

  console.log(`[SERVER] Data fetched. Rendering client form with ${landmarks.length} landmarks.`);

  // Pass the server-fetched data as props to the client component.
  return (
    <>
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-normal text-on-surface">
          Start a New Sowing Cycle
        </h1>
        <p className="text-on-surface-variant mt-1">
          Search for an existing farmer or register a new one to begin a new crop cycle.
        </p>
      </header>
      <NewCycleForm
        landmarks={landmarks}
        seedVarieties={seedVarieties}
        initialSeedPrice={initialSeedPrice}
      />
    </>
  );
}