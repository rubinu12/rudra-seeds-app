// components/admin/cycles/new/FarmerSearch.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { FarmerDetails } from '@/lib/definitions';
import { Search, LoaderCircle, UserPlus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce'; // We will create this hook next

type FarmerSearchResult = Pick<FarmerDetails, 'farmer_id' | 'name' | 'mobile_number'>;

type FarmerSearchProps = {
  onFarmerSelect: (farmer: FarmerDetails | null) => void;
  // We'll receive the selected farmer as a prop to manage the input's value
  selectedFarmer: FarmerDetails | null; 
};

export default function FarmerSearch({ onFarmerSelect, selectedFarmer }: FarmerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FarmerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Effect to fetch search results when the debounced query changes
  useEffect(() => {
    const fetchFarmers = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setDropdownOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/farmers/search?query=${debouncedQuery}`);
        const data = await response.json();
        setResults(data);
        setDropdownOpen(data.length > 0);
      } catch (error) {
        console.error("Failed to fetch farmers:", error);
        setResults([]);
      }
      setIsLoading(false);
    };

    fetchFarmers();
  }, [debouncedQuery]);

  // Handler for selecting a farmer from the dropdown
  const handleSelect = async (farmer: FarmerSearchResult) => {
    setIsLoading(true);
    setQuery(`${farmer.name} (${farmer.mobile_number})`);
    setDropdownOpen(false);
    try {
        const response = await fetch(`/api/farmers/${farmer.farmer_id}/details`);
        const fullDetails: FarmerDetails = await response.json();
        onFarmerSelect(fullDetails); // Pass full details up to the parent
    } catch (error) {
        console.error("Failed to fetch farmer details:", error);
    }
    setIsLoading(false);
  };
  
  // Handler for clearing the selection and starting a new farmer entry
  const handleClear = () => {
      setQuery('');
      setResults([]);
      onFarmerSelect(null);
      setDropdownOpen(false);
  }

  return (
    <div className="form-section-card" style={{ background: 'rgba(234, 221, 255, 0.25)' }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary-container p-3 rounded-m3-large shadow-sm">
          <UserPlus className="h-6 w-6 text-on-primary-container" />
        </div>
        <h2 className="text-2xl font-normal text-on-surface">Find or Add Farmer</h2>
      </div>
      
      <div className="relative">
        <label htmlFor="farmerSearch" className="form-label">Search by Mobile or Name</label>
        <div className="relative flex items-center">
            <div className="absolute left-4 h-full flex items-center pointer-events-none">
                {isLoading ? (
                    <LoaderCircle className="h-5 w-5 text-on-surface-variant animate-spin" />
                ) : (
                    <Search className="h-5 w-5 text-on-surface-variant" />
                )}
            </div>
            <input
                type="text"
                id="farmerSearch"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-input pl-12 pr-10"
                placeholder="Start typing..."
                autoComplete="off"
            />
            {selectedFarmer && (
                <button type="button" onClick={handleClear} className="btn absolute right-2 p-1 rounded-full hover:bg-black/10">
                    <X className="h-5 w-5 text-on-surface-variant"/>
                </button>
            )}
        </div>

        {isDropdownOpen && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-outline/30 rounded-m3-large shadow-lg">
                <ul>
                    {results.map((farmer, index) => (
                        <li 
                            key={farmer.farmer_id}
                            onClick={() => handleSelect(farmer)}
                            className={`px-4 py-3 cursor-pointer hover:bg-primary-container/50 ${index > 0 ? 'border-t border-outline/20' : ''}`}
                        >
                            <p className="font-medium text-on-surface">{farmer.name}</p>
                            <p className="text-sm text-on-surface-variant">{farmer.mobile_number}</p>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
}

// We need to create this simple debounce hook.
// Create a new file at `hooks/useDebounce.ts` for this.
const X = ({ className }: { className: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;