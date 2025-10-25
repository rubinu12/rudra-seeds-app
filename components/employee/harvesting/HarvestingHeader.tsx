// components/employee/harvesting/HarvestingHeader.tsx
"use client";

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import React from 'react';

// Re-use types and constants from the main dashboard
type CollectionMethod = 'All' | 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard';
const collectionMethods: CollectionMethod[] = ['All', 'Farm', 'Parabadi yard', 'Dhoraji yard', 'Jalasar yard'];
const collectionMethodLabels: Record<CollectionMethod, string> = {
    'All': 'બધા',
    'Farm': 'ખેતર',
    'Parabadi yard': 'પરબડી યાર્ડ',
    'Dhoraji yard': 'ધોરાજી યાર્ડ',
    'Jalasar yard': 'જાળાસર યાર્ડ'
};

type HarvestingHeaderProps = {
    collectionMethodFilter: CollectionMethod;
    handleCollectionFilterChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    isFilterDisabled: boolean; // Control when the dropdown is disabled
};

export default function HarvestingHeader({
    collectionMethodFilter,
    handleCollectionFilterChange,
    isFilterDisabled
}: HarvestingHeaderProps) {
    return (
        <header className="sticky top-0 left-0 right-0 z-20 bg-surface/80 backdrop-blur-md border-b border-outline/30">
            <div className="max-w-xl mx-auto flex items-center justify-between h-16 px-4">
                <Link href="/employee/dashboard" className="text-xl font-bold text-primary">
                    RudraSeeds
                </Link>
                {/* Header Dropdown for Collection Method */}
                <div className="relative flex-1 max-w-[180px] mx-4">
                     <select
                        value={collectionMethodFilter}
                        onChange={handleCollectionFilterChange}
                        disabled={isFilterDisabled} // Use prop to control disabled state
                        className={`w-full h-10 px-3 pr-8 rounded-full border text-sm appearance-none focus:outline-none focus:ring-1 transition-colors ${
                            isFilterDisabled
                            ? 'bg-outline/10 border-outline/30 text-on-surface-variant cursor-not-allowed ring-transparent' // Disabled style
                            : 'bg-surface-container border-outline text-on-surface focus:border-primary ring-primary/50' // Enabled style
                        }`}
                     >
                        {collectionMethods.map(method => (
                            <option key={method} value={method}>{collectionMethodLabels[method]}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
                <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-semibold shrink-0">
                    EM
                </div>
            </div>
        </header>
    );
}