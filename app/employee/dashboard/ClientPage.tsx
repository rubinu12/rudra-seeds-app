// app/employee/dashboard/ClientPage.tsx
"use client";

import { useState, useEffect } from 'react';
import { CropCycleForEmployee } from '@/lib/growing-data';
import { Landmark } from '@/lib/definitions';
import { Search, X } from 'lucide-react';
import Link from 'next/link';

type Props = {
  initialCycles: CropCycleForEmployee[];
  landmarks: Landmark[];
  // seedVarieties: SeedVariety[]; // Add this when you're ready to implement filters
};

export default function ClientPage({ initialCycles, landmarks }: Props) {
  const [cycles, setCycles] = useState(initialCycles);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      setCycles(initialCycles);
      return;
    }
    const filtered = initialCycles.filter(cycle => 
      cycle.farmer_name.toLowerCase().includes(query)
    );
    setCycles(filtered);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-2xl p-2">
        {/* Filter View */}
        <div className={`flex gap-2 items-center ${isSearching ? 'hidden' : ''}`}>
          <div className="flex gap-2 flex-grow">
            <button className="flex-1 h-12 rounded-full bg-surface-container border border-outline text-on-surface-variant font-medium text-sm">ગામ</button>
            <button className="flex-1 h-12 rounded-full bg-surface-container border border-outline text-on-surface-variant font-medium text-sm">વેરાયટી</button>
            <button className="flex-1 h-12 rounded-full bg-surface-container border border-outline text-on-surface-variant font-medium text-sm">લેન્ડમાર્ક</button>
          </div>
          <button onClick={() => setIsSearching(true)} className="flex-shrink-0 w-12 h-12 grid place-items-center rounded-full bg-surface-container border border-outline">
            <Search className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Search View */}
        <div className={`relative ${isSearching ? '' : 'hidden'}`}>
          <input
            type="text"
            placeholder="ખેડૂતનું નામ / મોબાઇલ શોધો..."
            onChange={handleSearch}
            className="w-full h-12 pl-4 pr-12 rounded-full border-2 border-primary bg-surface-container text-on-surface"
          />
          <button onClick={() => { setIsSearching(false); setCycles(initialCycles); }} className="absolute top-0 right-0 h-12 w-12 grid place-items-center">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        {cycles.length > 0 ? (
          cycles.map(cycle => (
            <div key={cycle.crop_cycle_id} className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-lg text-on-surface">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
              </div>
              <Link href={`/employee/visits/${cycle.crop_cycle_id}`} className="bg-primary text-on-primary font-medium py-2 px-6 rounded-full shadow-sm">
                વિગતવાર
              </Link>
            </div>
          ))
        ) : (
          <p className="text-center text-on-surface-variant mt-8">કોઈ પરિણામ મળ્યું નથી.</p>
        )}
      </section>
    </div>
  );
}