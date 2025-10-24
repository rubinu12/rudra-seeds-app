// app/employee/harvesting/HarvestingDashboard.tsx
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { CropCycleForEmployee } from '@/lib/definitions';
import { Search, LoaderCircle, Wheat, ThumbsUp, PackageCheck, Package, DollarSign, Tractor, ChevronRight } from 'lucide-react';
import * as harvestingActions from './actions';

type Props = {
    cyclesToSample: CropCycleForEmployee[];
    cyclesToWeigh: CropCycleForEmployee[];
};

export default function HarvestingDashboard({ cyclesToSample, cyclesToWeigh }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<CropCycleForEmployee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeList, setActiveList] = useState<'sample' | 'weigh' | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm) {
            setIsLoading(true);
            setActiveList(null); // Clear active list when searching
            fetch(`/api/cycles/search?query=${debouncedSearchTerm}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                })
                .finally(() => setIsLoading(false));
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchTerm]);

    const listToDisplay = activeList === 'sample' ? cyclesToSample : activeList === 'weigh' ? cyclesToWeigh : [];
    const showSearch = searchTerm.length > 0;

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

            {/* Conditional Display: Show notifications or search results */}
            {showSearch ? (
                // SEARCH RESULTS VIEW
                <section className="flex flex-col gap-3">
                    {searchResults.length > 0 ? (
                        searchResults.map(cycle => (
                            <HarvestCycleItem key={cycle.crop_cycle_id} cycle={cycle} />
                        ))
                    ) : (
                        !isLoading && <p className="text-center text-on-surface-variant mt-8">No farmers found for your search.</p>
                    )}
                </section>
            ) : (
                // NOTIFICATION & TO-DO LIST VIEW
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <NotificationCard
                            title="Pending Samples"
                            count={cyclesToSample.length}
                            onClick={() => setActiveList(activeList === 'sample' ? null : 'sample')}
                            isActive={activeList === 'sample'}
                            Icon={PackageCheck}
                        />
                        <NotificationCard
                            title="Pending Weighing"
                            count={cyclesToWeigh.length}
                            onClick={() => setActiveList(activeList === 'weigh' ? null : 'weigh')}
                            isActive={activeList === 'weigh'}
                            Icon={DollarSign}
                        />
                    </div>
                    <section className="flex flex-col gap-3">
                        {activeList && listToDisplay.map(cycle => (
                            <HarvestCycleItem key={cycle.crop_cycle_id} cycle={cycle} />
                        ))}
                    </section>
                </div>
            )}
        </div>
    );
}

// --- Sub-Components ---

function NotificationCard({ title, count, onClick, isActive, Icon }: { title: string, count: number, onClick: () => void, isActive: boolean, Icon: React.ElementType }) {
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${isActive ? 'bg-primary/10 border-primary' : 'bg-surface-container border-outline/50 hover:border-outline'}`}
        >
            <div className="flex justify-between items-center">
                <div className={`w-10 h-10 rounded-full grid place-items-center ${isActive ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className={`w-6 h-6 transition-transform ${isActive ? 'rotate-90 text-primary' : 'text-on-surface-variant'}`} />
            </div>
            <p className="mt-4 text-2xl font-bold text-on-surface">{count}</p>
            <p className="text-sm font-medium text-on-surface-variant">{title}</p>
        </button>
    )
}

function HarvestCycleItem({ cycle }: { cycle: CropCycleForEmployee }) {
    const [isPending, startTransition] = useTransition();

    const handleAction = (action: (prevState: any, formData: FormData) => Promise<any>) => {
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        startTransition(async () => {
            const result = await action(null as any, formData);
            if(result.success) {
                alert(result.message);
                window.location.reload();
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };

    let statusContent;

    switch (cycle.status) {
        case 'Growing':
            statusContent = <ActionToggle label="Harvested" onToggle={() => handleAction(harvestingActions.startHarvesting)} isPending={isPending} />;
            break;
        case 'Harvested':
            statusContent = <ActionToggle label="Sample Collected" onToggle={() => handleAction(harvestingActions.markSampleCollected)} isPending={isPending} />;
            break;
        case 'Sample Collected':
            statusContent = <button className="btn-secondary-small">Enter Sample Data</button>;
            break;
        case 'Sampled':
            statusContent = <span className="text-xs text-on-surface-variant">Admin Action</span>;
            break;
        case 'Priced':
            statusContent = <button className="btn-primary-small">Start Weighing</button>;
            break;
        default:
            statusContent = <span className="text-xs text-on-surface-variant">No Action</span>;
    }

    return (
        <div className="bg-surface/80 backdrop-blur-md border border-outline/30 rounded-2xl p-4">
            <div>
                <p className="font-bold text-lg text-on-surface">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-outline/30 flex justify-end">
                {statusContent}
            </div>
        </div>
    );
}

const ActionToggle = ({ label, onToggle, isPending }: { label: string, onToggle: () => void, isPending: boolean }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input
            type="checkbox"
            className="sr-only peer"
            onChange={onToggle}
            disabled={isPending}
        />
        <div className="w-11 h-6 bg-outline rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        <span className="ml-3 text-sm font-medium text-on-surface-variant">
            {isPending ? 'Updating...' : `Mark as ${label}`}
        </span>
    </label>
);