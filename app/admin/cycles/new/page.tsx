// app/admin/cycles/new/page.tsx
import { getLandmarks, getSeedVarieties, getCurrentSeedPrice } from '@/lib/data';
import NewCycleForm from '@/components/admin/cycles/new/NewCycleForm';

export default async function NewCyclePage() {
  // Fetch initial data on the server
  const landmarks = await getLandmarks();
  const seedVarieties = await getSeedVarieties();
  const currentPrice = await getCurrentSeedPrice();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-normal text-on-surface">
          Start a New Sowing Cycle
        </h1>
        <p className="text-on-surface-variant mt-1">
          Search for an existing farmer or register a new one to begin a new crop cycle.
        </p>
      </header>

      {/* We are passing the server-fetched data as props to a Client Component.
        This is a standard and performant pattern in the Next.js App Router.
      */}
      <NewCycleForm 
        landmarks={landmarks} 
        seedVarieties={seedVarieties}
        initialSeedPrice={currentPrice}
      />
    </div>
  );
}