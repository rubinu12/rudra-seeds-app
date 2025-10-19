// app/employee/harvesting/HarvestingDashboard.tsx
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { CropCycleForEmployee } from '@/lib/definitions';
import { Search, LoaderCircle, Wheat, ThumbsUp, PackageCheck, Package, DollarSign, Tractor } from 'lucide-react';
import * as harvestingActions from './actions';

type Props = {
    // We can pass initial "to-do" lists here later if needed
};

export default function HarvestingDashboard({}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]); // Using 'any' for now to accommodate the status property
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm) {
            setIsLoading(true);
            // Use our universal search API
            fetch(`/api/cycles/search?query=${debouncedSearchTerm}`)
                .then(res => res.json())
                .then(data => {
                    // We need to fetch the full cycle data to get the 'status'
                    // For now, we'll simulate it. In a real scenario, the API would be updated.
                    const resultsWithStatus = data.map((item: CropCycleForEmployee) => ({
                        ...item,
                        // TODO: The universal API needs to be updated to return the 'status' field.
                        // Simulating different statuses for demonstration.
                        status: ['Growing', 'Harvested', 'Sample Collected', 'Sampled', 'Priced'][Math.floor(Math.random() * 5)]
                    }));
                    setResults(resultsWithStatus);
                })
                .finally(() => setIsLoading(false));
        } else {
            setResults([]);
        }
    }, [debouncedSearchTerm]);

    return (
        <div className="p-4 max-w-xl mx-auto flex flex-col gap-6">
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search Farmer by Name or Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-full border-2 border-outline bg-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <div className="absolute top-0 left-0 h-14 w-12 grid place-items-center">
                    {isLoading ? (
                        <LoaderCircle className="w-5 h-5 text-on-surface-variant animate-spin" />
                    ) : (
                        <Search className="w-5 h-5 text-on-surface-variant" />
                    )}
                </div>
            </div>

            {/* Search Results / To-Do Lists */}
            <section className="flex flex-col gap-3">
                {results.length > 0 ? (
                    results.map(cycle => (
                        <HarvestCycleItem key={cycle.crop_cycle_id} cycle={cycle} />
                    ))
                ) : (
                     <p className="text-center text-on-surface-variant mt-8">Search for a farmer to begin the harvesting process.</p>
                )}
            </section>
        </div>
    );
}

// Context-Aware Item Component
function HarvestCycleItem({ cycle }: { cycle: any }) {
    const [isPending, startTransition] = useTransition();

    const handleHarvest = () => {
        const formData = new FormData();
        formData.append('cropCycleId', cycle.crop_cycle_id);
        startTransition(async () => {
            const result = await harvestingActions.startHarvesting(null as any, formData);
            alert(result.message);
        });
    };
    
    let statusIcon, statusText, actionButton;

    switch (cycle.status) {
        case 'Growing':
            statusIcon = <Wheat className="text-green-500" />;
            statusText = 'Growing';
            actionButton = <button onClick={handleHarvest} disabled={isPending} className="btn-primary-small">{isPending ? 'Updating...' : 'Mark as Harvested'}</button>;
            break;
        case 'Harvested':
            statusIcon = <ThumbsUp className="text-blue-500" />;
            statusText = 'Harvested';
            actionButton = <button className="btn-secondary-small">Collect Sample</button>;
            break;
        case 'Sample Collected':
            statusIcon = <PackageCheck className="text-cyan-500" />;
            statusText = 'Sample Collected';
            actionButton = <button className="btn-secondary-small">Enter Sample Data</button>;
            break;
        case 'Sampled':
            statusIcon = <Package className="text-purple-500" />;
            statusText = 'Sampled (Price Pending)';
            actionButton = <span className="text-sm text-on-surface-variant">Admin Action</span>;
            break;
        case 'Priced':
            statusIcon = <DollarSign className="text-amber-500" />;
            statusText = 'Priced';
            actionButton = <button className="btn-primary-small">Start Weighing</button>;
            break;
        default:
            statusIcon = <Tractor className="text-gray-500" />;
            statusText = cycle.status;
    }

    return (
        <div className="bg-surface/80 backdrop-blur-md border border-outline/30 rounded-2xl p-4">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg text-on-surface">{cycle.farmer_name}</p>
                    <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full bg-surface-container">
                        {statusIcon}
                        <span>{statusText}</span>
                    </div>
                    {actionButton}
                </div>
            </div>
        </div>
    );
}