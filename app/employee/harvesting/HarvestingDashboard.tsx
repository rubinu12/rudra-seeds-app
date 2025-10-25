// app/employee/harvesting/HarvestingDashboard.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';
import { Search, LoaderCircle, SlidersHorizontal, Scale, CheckSquare, Phone, PackageCheck, Beaker, ChevronDown } from 'lucide-react';
import * as harvestingActions from './actions';
import SearchableSelect from '@/components/ui/SearchableSelect'; // Keep for SearchResultItem

// Import new components
import HarvestingHeader from '@/components/employee/harvesting/HarvestingHeader';
import HarvestingBottomNav from '@/components/employee/harvesting/HarvestingBottomNav';
import SamplingListsSection from '@/components/employee/harvesting/SamplingListsSection';
import WeighingInputSection from '@/components/employee/harvesting/WeighingInputSection';
import { CollapsibleSection, TabButton } from '@/components/employee/harvesting/SharedComponents'; // Import shared

type Props = {
    cyclesToSample: CropCycleForEmployeeWeighing[];
    cyclesToWeigh: CropCycleForEmployeeWeighing[];
};

type CollectionMethod = 'All' | 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard';

// --- Main Dashboard Component ---
export default function HarvestingDashboard({ cyclesToSample, cyclesToWeigh }: Props) {
    const [mainSearchTerm, setMainSearchTerm] = useState('');
    const [mainSearchResults, setMainSearchResults] = useState<CropCycleForEmployeeWeighing[]>([]);
    const [isMainSearchLoading, setIsMainSearchLoading] = useState(false);
    const debouncedMainSearchTerm = useDebounce(mainSearchTerm, 350);

    const [activeListTab, setActiveListTab] = useState<'sampling' | 'weighing'>('sampling');
    const [collectionMethodFilter, setCollectionMethodFilter] = useState<CollectionMethod>('All');
    const [lastWeighingFilter, setLastWeighingFilter] = useState<CollectionMethod>('All');
    const [secondarySearchTerm, setSecondarySearchTerm] = useState('');
    const [activeBottomNav, setActiveBottomNav] = useState<'weighing_sampling' | 'loading'>('weighing_sampling');
    const [currentlyWeighingCycleId, setCurrentlyWeighingCycleId] = useState<number | null>(null); // State for expanded weighing item
    const [isWeighingListOpen, setIsWeighingListOpen] = useState(true); // State for weighing list collapsibility

    // Effect for main search
    useEffect(() => {
        if (debouncedMainSearchTerm) {
            setIsMainSearchLoading(true);
            fetch(`/api/cycles/search?query=${debouncedMainSearchTerm}`)
                .then(res => res.json())
                .then((data: CropCycleForEmployeeWeighing[]) => {
                    const resultsWithDefaults = data.map(cycle => ({ ...cycle, goods_collection_method: cycle.goods_collection_method || 'Farm' }));
                    setMainSearchResults(resultsWithDefaults);
                })
                .catch(err => { console.error("Failed to fetch search results:", err); setMainSearchResults([]); })
                .finally(() => setIsMainSearchLoading(false));
        } else { setMainSearchResults([]); }
    }, [debouncedMainSearchTerm]);

    // Effect for collection filter logic based on active tab
    useEffect(() => {
        // Use functional update for setActiveListTab's dependency array isn't needed
        if (activeListTab === 'sampling') {
            setCollectionMethodFilter('All');
        } else {
            setCollectionMethodFilter(lastWeighingFilter);
        }
        setCurrentlyWeighingCycleId(null); // Close weighing input when switching tabs
    }, [activeListTab, lastWeighingFilter]);


    // Handler for collection filter change
    const handleCollectionFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value as CollectionMethod;
        setCollectionMethodFilter(newValue);
        if (activeListTab === 'weighing') { setLastWeighingFilter(newValue); }
        setCurrentlyWeighingCycleId(null); // Close weighing input when changing filter
    };

    const isMainSearchActive = mainSearchTerm.length > 0;

    // Filter lists based on secondary search and collection method (for weighing tab)
     const filterFn = useCallback((cycle: CropCycleForEmployeeWeighing) => {
        const term = secondarySearchTerm.toLowerCase();
        // Filter by collection method only if weighing tab is active and filter is not 'All'
        const collectionMatch = activeListTab === 'weighing' && collectionMethodFilter !== 'All'
            ? cycle.goods_collection_method === collectionMethodFilter
            : true;
        // Filter by secondary search term (name or mobile)
        const searchMatch = term === '' || cycle.farmer_name.toLowerCase().includes(term) || cycle.mobile_number?.includes(term);
        return collectionMatch && searchMatch;
    }, [secondarySearchTerm, collectionMethodFilter, activeListTab]);

    // Apply filtering to the lists
    const harvestedCycles = useMemo(() => cyclesToSample.filter(c => c.status === 'Harvested').filter(filterFn), [cyclesToSample, filterFn]);
    const sampleCollectedCycles = useMemo(() => cyclesToSample.filter(c => c.status === 'Sample Collected').filter(filterFn), [cyclesToSample, filterFn]);
    const weighingCycles = useMemo(() => cyclesToWeigh.filter(filterFn), [cyclesToWeigh, filterFn]); // Filtered list for weighing tab

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Use HarvestingHeader */}
            <HarvestingHeader
                collectionMethodFilter={collectionMethodFilter}
                handleCollectionFilterChange={handleCollectionFilterChange}
                isFilterDisabled={activeListTab === 'sampling' && !isMainSearchActive} // Pass disabled logic
            />

            {/* --- Main Content Area --- */}
            <main className="flex-grow p-4 max-w-xl mx-auto w-full space-y-4 pb-20">
                {/* Main Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="ખેડૂતનું નામ / ફોન શોધો..."
                        value={mainSearchTerm}
                        onChange={(e) => setMainSearchTerm(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-full border-2 border-outline bg-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <div className="absolute top-0 left-0 h-14 w-12 grid place-items-center pointer-events-none">
                        {isMainSearchLoading ? <LoaderCircle className="w-5 h-5 text-on-surface-variant animate-spin" /> : <Search className="w-5 h-5 text-on-surface-variant" />}
                    </div>
                </div>

                {/* Conditional Rendering: Search Results vs Tabs */}
                {isMainSearchActive ? (
                    <SearchResultsSection
                        results={mainSearchResults}
                        isLoading={isMainSearchLoading}
                        searchTerm={debouncedMainSearchTerm}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* Primary Tabs */}
                        <div className="flex bg-surface-container p-1 rounded-full border border-outline/50">
                            <TabButton label="સેમ્પલિંગ" isActive={activeListTab === 'sampling'} onClick={() => setActiveListTab('sampling')} />
                            <TabButton label="વજન" isActive={activeListTab === 'weighing'} onClick={() => setActiveListTab('weighing')} />
                        </div>

                        {/* Secondary Search/Filter Bar */}
                        <SecondaryFilterBar searchTerm={secondarySearchTerm} setSearchTerm={setSecondarySearchTerm} />

                        {/* Render based on active tab */}
                        {activeListTab === 'sampling' && (
                            <SamplingListsSection // Use SamplingListsSection component
                                harvestedList={harvestedCycles}
                                sampleCollectedList={sampleCollectedCycles}
                            />
                        )}

                        {activeListTab === 'weighing' && (
                            <CollapsibleSection // Use CollapsibleSection directly for weighing list
                                title={`વજન કરવાનું બાકી છે (${weighingCycles.length})`}
                                isOpen={isWeighingListOpen}
                                setIsOpen={setIsWeighingListOpen}
                            >
                                <div className="space-y-3 pt-2">
                                    {weighingCycles.length > 0 ? (
                                        weighingCycles.map(cycle => (
                                            <CycleListItem // Render CycleListItem for weighing
                                                key={cycle.crop_cycle_id}
                                                cycle={cycle}
                                                listType="weighing"
                                                isWeighingOpen={currentlyWeighingCycleId === cycle.crop_cycle_id} // Pass open state
                                                setCurrentlyWeighingCycleId={setCurrentlyWeighingCycleId} // Pass setter
                                            />
                                        ))
                                    ) : (
                                        <p className="text-center text-on-surface-variant py-8">આ તબક્કા માટે કોઈ સાયકલ મળેલ નથી.</p>
                                    )}
                                </div>
                            </CollapsibleSection>
                        )}
                    </div>
                )}
            </main>

            {/* Use HarvestingBottomNav */}
            <HarvestingBottomNav
                activeBottomNav={activeBottomNav}
                setActiveBottomNav={setActiveBottomNav}
            />
        </div>
    );
}

// --- Sub-Components ---

// Secondary Filter Bar (Moved from SamplingListsSection for use by both tabs)
function SecondaryFilterBar({ searchTerm, setSearchTerm }: { searchTerm: string, setSearchTerm: (term: string) => void }) {
    return (
        <div className="relative flex items-center gap-2 bg-surface-container p-2 rounded-xl border border-outline/50">
            <Search className="w-5 h-5 text-on-surface-variant ml-2 flex-shrink-0" />
            <input
                type="text"
                placeholder="નામ / ફોન દ્વારા યાદીમાં શોધો..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-transparent focus:outline-none text-sm h-8"
            />
            <button className="p-2 rounded-full hover:bg-primary/10">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
            </button>
        </div>
    );
}

// *** UPDATED CycleListItem to handle weighing expansion ***
function CycleListItem({
    cycle,
    listType,
    isWeighingOpen, // Prop to know if weighing section is open for this item
    setCurrentlyWeighingCycleId // Prop to set which item is open
}: {
    cycle: CropCycleForEmployeeWeighing,
    listType: 'sampling' | 'weighing',
    isWeighingOpen?: boolean, // Optional: only needed for weighing list
    setCurrentlyWeighingCycleId?: (id: number | null) => void // Optional: only needed for weighing list
}) {
    // Note: ActionToggle component is now inside SamplingListsSection

    let actionElement = null;
    const buttonStyle = "h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all";

    // Action/Display logic based on listType and status
    if (listType === 'sampling') {
        // Sampling actions are now handled within SamplingListsSection's CycleListItem
        // This component instance will only be rendered via SamplingListsSection
        // We only need basic display here if we were to reuse it, but let's assume
        // SamplingListsSection uses its own internal CycleListItem for now.
        // For simplicity, we can duplicate the necessary display logic if needed,
        // but ideally, CycleListItem would be more generic or moved entirely inside SamplingListsSection.
        // --> Let's assume SamplingListsSection handles its items fully.
        // --> This CycleListItem instance will now ONLY handle the WEIGHING list display.

    } else if (listType === 'weighing') {
        if (cycle.status === 'Priced') {
            actionElement = (
                <button
                    onClick={() => setCurrentlyWeighingCycleId?.(cycle.crop_cycle_id)} // Open weighing input
                    className={`${buttonStyle} bg-primary text-on-primary hover:shadow-md w-full sm:w-auto`} // Make button full width on small screens
                >
                    <Scale className="w-4 h-4" /> વજન શરૂ કરો
                </button>
            );
        } else if (cycle.status === 'Weighed') {
             actionElement = ( // Display recorded bags
                 <div className="text-sm text-center font-medium text-green-700 bg-green-100 px-4 py-2 rounded-full w-full">
                     વજન પૂર્ણ: {cycle.quantity_in_bags ?? 'N/A'} બેગ
                 </div>
             );
         }
    }

    const statusDisplayMap: Record<string, string> = {
        'Harvested': 'લણણી કરેલ', 'Sample Collected': 'સેમ્પલ કલેક્ટેડ', 'Sampled': 'સેમ્પલ લેવાયું',
        'Price Proposed': 'ભાવ પ્રસ્તાવિત', 'Priced': 'ભાવ નક્કી', 'Weighed': 'વજન પૂર્ણ',
        'Growing': 'વાવેતર ચાલે છે'
     };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status;

    return (
        <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            {/* Top section: Info + Call button */}
            <div className="flex justify-between items-start mb-3">
                 <div>
                    <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p>
                    {cycle.mobile_number ? (
                        <p className="flex items-center gap-1 text-sm text-on-surface-variant my-1"> <Phone className="w-3 h-3" /> {cycle.mobile_number} </p>
                    ) : ( <p className="flex items-center gap-1 text-sm text-on-surface-variant/70 my-1 italic"> <Phone className="w-3 h-3" /> (No mobile) </p> )}
                    <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                        {cycle.lot_no && `Lot: ${cycle.lot_no}`}
                        {cycle.lot_no && cycle.landmark_name && ' • '}
                        {cycle.landmark_name && `Landmark: ${cycle.landmark_name}`}
                    </p>
                    <p className="text-xs mt-1 font-medium text-primary">{displayStatus}</p>
                 </div>
                 {cycle.mobile_number && (
                     <a href={`tel:${cycle.mobile_number}`}
                        className="flex-shrink-0 ml-2 mt-1 p-2 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors"
                        aria-label={`Call ${cycle.farmer_name}`}
                     > <Phone className="w-5 h-5" /> </a>
                 )}
            </div>

            {/* Action Button Area (Weighing Tab Only) */}
            {listType === 'weighing' && actionElement && !isWeighingOpen && ( // Show button only if weighing input is NOT open
                <div className="mt-3 pt-3 border-t border-outline/20 flex justify-end">
                    {actionElement}
                </div>
            )}

             {/* Weighing Input Section (Weighing Tab Only, when open) */}
             {listType === 'weighing' && isWeighingOpen && (
                 <WeighingInputSection
                    cycle={cycle}
                    onCancel={() => setCurrentlyWeighingCycleId?.(null)} // Close the section
                 />
            )}
        </div>
    );
}


// Search Results Section (Refactored to use SearchResultItem)
function SearchResultsSection({ results, isLoading, searchTerm }: { results: CropCycleForEmployeeWeighing[], isLoading: boolean, searchTerm: string }) {
    return (
        <div className="space-y-3">
             <h2 className="text-sm font-medium text-on-surface-variant px-2">શોધ પરિણામો ({results.length})</h2>
            {isLoading && <div className="flex justify-center items-center py-10"><LoaderCircle className="w-8 h-8 text-primary animate-spin" /></div>}
            {!isLoading && results.length === 0 && searchTerm && <p className="text-center text-on-surface-variant py-8">"{searchTerm}" થી મેળ ખાતા કોઈ ખેડૂત મળ્યા નથી.</p>}
            {!isLoading && results.length > 0 && results.map(cycle => ( <SearchResultItem key={cycle.crop_cycle_id} cycle={cycle} /> ))}
        </div>
    );
}

// Search Result Item (Handles 'Growing' -> 'Harvested' action)
function SearchResultItem({ cycle }: { cycle: CropCycleForEmployeeWeighing }) {
    const [isPending, startTransition] = useTransition();
    const [selectedCollectionMethod, setSelectedCollectionMethod] = useState(cycle.goods_collection_method || 'Farm');

    useEffect(() => { setSelectedCollectionMethod(cycle.goods_collection_method || 'Farm'); }, [cycle.goods_collection_method]);

    const handleConfirmHarvest = () => { /* ... same confirm harvest logic ... */
        if (cycle.status !== 'Growing' || !selectedCollectionMethod) return;
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        formData.append('goods_collection_method', selectedCollectionMethod);
        startTransition(async () => {
            const result = await harvestingActions.startHarvesting(null, formData);
            if (result.success) { window.location.reload(); }
            else { alert(`Error: ${result.message || 'Failed harvest confirm.'}`); }
        });
     };

    const collectionOptions = [ { value: 'Farm', label: 'ખેતર' }, { value: 'Parabadi yard', label: 'પરબડી યાર્ડ' }, { value: 'Dhoraji yard', label: 'ધોરાજી યાર્ડ' }, { value: 'Jalasar yard', label: 'જાળાસર યાર્ડ' } ];
    let nextActionElement = null;
    const buttonStyle = "w-full h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-md";
    const statusDisplayMap: Record<string, string> = { 'Harvested': 'લણણી કરેલ', 'Sample Collected': 'સેમ્પલ કલેક્ટેડ', 'Sampled': 'સેમ્પલ લેવાયું', 'Price Proposed': 'ભાવ પ્રસ્તાવિત', 'Priced': 'ભાવ નક્કી', 'Weighed': 'વજન પૂર્ણ', 'Growing': 'વાવેતર ચાલે છે' };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status;
    const displayReadyToHarvest = 'લણણી માટે તૈયાર';

    switch (cycle.status) {
        case 'Growing':
            nextActionElement = ( /* ... same button/select as before ... */
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:flex-1"> <div className="relative rounded-lg border border-outline bg-surface-container h-[40px]"> <select id={`collection-select-${cycle.crop_cycle_id}`} value={selectedCollectionMethod} onChange={(e) => setSelectedCollectionMethod(e.target.value)} className="w-full h-full pl-3 pr-8 rounded-lg bg-transparent appearance-none text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"> {collectionOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))} </select> <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" /> </div> </div>
                     <button onClick={handleConfirmHarvest} disabled={isPending || !selectedCollectionMethod} className={`${buttonStyle} sm:w-auto bg-primary text-on-primary disabled:opacity-50`}> {isPending ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <CheckSquare className="w-4 h-4" />} લણણીની પુષ્ટિ કરો </button>
                </div> ); break;
        case 'Harvested': nextActionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container`}><PackageCheck className="w-4 h-4" /> સેમ્પલ લો</Link>; break;
        case 'Sample Collected': nextActionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container`}><Beaker className="w-4 h-4" /> સેમ્પલ ડેટા દાખલ કરો</Link>; break;
        case 'Sampled': nextActionElement = <div className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-full w-full text-center block font-medium">એડમિનના ભાવ બાકી</div>; break;
        case 'Priced': nextActionElement = <button className={`${buttonStyle} bg-primary text-on-primary`} disabled><Scale className="w-4 h-4" /> વજન શરૂ કરો</button>; break; // Disabled in search results
        case 'Weighed': nextActionElement = <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full w-full text-center block font-medium">વજન પૂર્ણ</div>; break;
        default: nextActionElement = <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full w-full text-center block font-medium">સ્થિતિ: {displayStatus}</div>;
    }
    return ( /* ... same display structure as before, no phone ... */
         <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            <div> <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p> <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p> <p className="text-xs mt-1 font-medium text-primary">{cycle.status === 'Growing' ? displayReadyToHarvest : displayStatus}</p> </div>
            {nextActionElement && ( <div className="mt-3 pt-3 border-t border-outline/20"> {nextActionElement} </div> )}
        </div> );
}