"use client";

import { useState, useEffect } from 'react';
import { CropCycleForEmployee } from '@/lib/definitions';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, LoaderCircle } from 'lucide-react';
import Link from 'next/link';

type Props = {
  initialCycles: CropCycleForEmployee[];
};

export default function ClientPage({ initialCycles }: Props) {
  const [cycles, setCycles] = useState(initialCycles);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      fetch(`/api/cycles/search?query=${debouncedSearchTerm}`)
        .then(res => res.json())
        .then(data => setCycles(data))
        .finally(() => setIsLoading(false));
    } else {
      setCycles(initialCycles);
    }
  }, [debouncedSearchTerm, initialCycles]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setCycles(initialCycles);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Search/Filter Bar */}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-4 pr-12 rounded-full border-2 border-primary bg-surface-container text-on-surface focus:ring-0 focus:outline-none"
          />
          <div className="absolute top-0 right-0 h-12 w-12 grid place-items-center">
            {isLoading ? (
              <LoaderCircle className="w-5 h-5 text-on-surface-variant animate-spin" />
            ) : (
              <X className="w-5 h-5 text-on-surface-variant cursor-pointer" onClick={handleClearSearch} />
            )}
          </div>
        </div>
      </div>

      {/* Farmer List */}
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
          !isLoading && <p className="text-center text-on-surface-variant mt-8">શોધવા માટે ખેડૂતનું નામ લખો.</p>
        )}
      </section>
    </div>
  );
}