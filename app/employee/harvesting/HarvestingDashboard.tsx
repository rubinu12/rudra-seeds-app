// app/employee/harvesting/HarvestingDashboard.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
// Use the extended type definition
import { CropCycleForEmployeeWeighing } from '@/lib/definitions';
import { MasterDataItem, ShipmentCompanySetting } from '@/app/admin/settings/data'; // Import company types
import { Search, LoaderCircle, SlidersHorizontal, Scale, CheckSquare, Phone, PackageCheck, Beaker, ChevronDown } from 'lucide-react';
import * as harvestingActions from './actions';

// Import child components
import HarvestingHeader from '@/components/employee/harvesting/HarvestingHeader';
import HarvestingBottomNav from '@/components/employee/harvesting/HarvestingBottomNav';
import SamplingListsSection from '@/components/employee/harvesting/SamplingListsSection';
import WeighingInputSection from '@/components/employee/harvesting/WeighingInputSection';
import { CollapsibleSection, TabButton } from '@/components/employee/harvesting/SharedComponents'; // Import shared
import LoadingView from './LoadingView'; // Import the new LoadingView component
import { InProgressShipment } from '@/app/employee/loading/data'; // Import shipment type

// Key for localStorage persistence
const LAST_ACTIVE_NAV_KEY = 'harvestingDashboard_lastActiveNav';

// Props expected from the server component (app/employee/dashboard/page.tsx)
type Props = {
    cyclesToSample: CropCycleForEmployeeWeighing[];
    cyclesToStartWeighing: CropCycleForEmployeeWeighing[]; // Cycles with 'Priced' status
    cyclesReadyForLoading: CropCycleForEmployeeWeighing[]; // Cycles with 'Weighed' status & bags > 0
    initialShipments: InProgressShipment[]; // Shipments with 'Loading' status
    transportCompanies: ShipmentCompanySetting[]; // Active transport companies
    destinationCompanies: MasterDataItem[]; // Active destination companies
};

// Types used within this component
type CollectionMethod = 'All' | 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard';
type BottomNavTab = 'weighing_sampling' | 'loading';

// --- Main Dashboard Component ---
export default function HarvestingDashboard({
    cyclesToSample,
    cyclesToStartWeighing, // Use updated prop
    cyclesReadyForLoading,
    initialShipments,
    transportCompanies,
    destinationCompanies
}: Props) {
    // --- State ---
    const [mainSearchTerm, setMainSearchTerm] = useState('');
    const [mainSearchResults, setMainSearchResults] = useState<CropCycleForEmployeeWeighing[]>([]);
    const [isMainSearchLoading, setIsMainSearchLoading] = useState(false);
    const debouncedMainSearchTerm = useDebounce(mainSearchTerm, 350);

    const [activeWeighingSamplingTab, setActiveWeighingSamplingTab] = useState<'sampling' | 'weighing'>('sampling');
    const [collectionMethodFilter, setCollectionMethodFilter] = useState<CollectionMethod>('All'); // Filter used by Header and passed to LoadingView
    const [lastWeighingFilter, setLastWeighingFilter] = useState<CollectionMethod>('All'); // To persist weighing filter
    const [secondarySearchTerm, setSecondarySearchTerm] = useState(''); // Search within Weighing/Sampling lists
    // *** FIX: Initialize with default, update in useEffect ***
    const [activeBottomNav, setActiveBottomNav] = useState<BottomNavTab>('weighing_sampling'); // Default value
    const [currentlyWeighingCycleId, setCurrentlyWeighingCycleId] = useState<number | null>(null); // Controls WeighingInputSection visibility
    const [isWeighingListOpen, setIsWeighingListOpen] = useState(true); // Collapsible state for weighing list

    // --- Effects ---

    // *** FIX: useEffect to load initial state from localStorage ***
    useEffect(() => {
        const savedTab = localStorage.getItem(LAST_ACTIVE_NAV_KEY);
        if (savedTab === 'weighing_sampling' || savedTab === 'loading') {
            setActiveBottomNav(savedTab);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

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

    // Effect to adjust header filter based on active WEIGHING/SAMPLING tab or main view
    useEffect(() => {
        if (activeBottomNav === 'weighing_sampling') {
             if (activeWeighingSamplingTab === 'sampling') {
                 setCollectionMethodFilter('All'); // Sampling tab always defaults header to 'All'
             } else {
                 setCollectionMethodFilter(lastWeighingFilter); // Weighing tab uses persisted filter
             }
        }
        // When switching *to* the Loading tab, the header filter state (collectionMethodFilter) persists from its last value.
        setCurrentlyWeighingCycleId(null); // Close weighing input when switching tabs/views
    }, [activeWeighingSamplingTab, lastWeighingFilter, activeBottomNav]); // Added activeBottomNav

    // Effect to SAVE activeBottomNav to localStorage
    useEffect(() => {
        // No need for typeof window check here as useEffect only runs client-side
        localStorage.setItem(LAST_ACTIVE_NAV_KEY, activeBottomNav);
    }, [activeBottomNav]);

    // --- Handlers ---
    // Handler for header collection filter change
    const handleCollectionFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value as CollectionMethod;
        setCollectionMethodFilter(newValue);
        // Persist the filter selection only if the Weighing tab (within Weighing/Sampling view) is active
        if (activeBottomNav === 'weighing_sampling' && activeWeighingSamplingTab === 'weighing') {
             setLastWeighingFilter(newValue);
        }
        setCurrentlyWeighingCycleId(null); // Close weighing input
    };

    // --- Memos ---
    const isMainSearchActive = mainSearchTerm.length > 0;

    // Filter function for lists within Weighing/Sampling view
     const filterFnWeighingSampling = useCallback((cycle: CropCycleForEmployeeWeighing) => {
        const term = secondarySearchTerm.toLowerCase();
        // Only apply collection filter if Weighing tab is active and filter isn't 'All'
        const collectionMatch = activeWeighingSamplingTab === 'weighing' && collectionMethodFilter !== 'All'
            ? cycle.goods_collection_method === collectionMethodFilter
            : true;
        const searchMatch = term === '' || cycle.farmer_name.toLowerCase().includes(term) || cycle.mobile_number?.includes(term);
        return collectionMatch && searchMatch;
    }, [secondarySearchTerm, collectionMethodFilter, activeWeighingSamplingTab]);

    // Apply filtering to the lists used ONLY in Weighing/Sampling view
    const harvestedCycles = useMemo(() => cyclesToSample.filter(c => c.status === 'Harvested').filter(filterFnWeighingSampling), [cyclesToSample, filterFnWeighingSampling]);
    const sampleCollectedCycles = useMemo(() => cyclesToSample.filter(c => c.status === 'Sample Collected').filter(filterFnWeighingSampling), [cyclesToSample, filterFnWeighingSampling]);
    // Use the correct prop for the weighing tab list
    const weighingTabCycles = useMemo(() => cyclesToStartWeighing.filter(filterFnWeighingSampling), [cyclesToStartWeighing, filterFnWeighingSampling]);

    // --- Render ---
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header: Pass correct filter state and disable logic */}
            <HarvestingHeader
                collectionMethodFilter={collectionMethodFilter}
                handleCollectionFilterChange={handleCollectionFilterChange}
                // Filter is disabled if main search is active OR (if on Weighing/Sampling view AND Sampling tab is selected)
                isFilterDisabled={isMainSearchActive || (activeBottomNav === 'weighing_sampling' && activeWeighingSamplingTab === 'sampling')}
            />

            {/* --- Main Content Area --- */}
            <main className="flex-grow p-4 max-w-xl mx-auto w-full space-y-4 pb-20"> {/* Ensure padding-bottom for nav */}
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

                {/* Conditional Rendering: Search Results vs Main Views */}
                {isMainSearchActive ? (
                    <SearchResultsSection
                        results={mainSearchResults}
                        isLoading={isMainSearchLoading}
                        searchTerm={debouncedMainSearchTerm}
                    />
                ) : (
                    // Show content based on activeBottomNav
                    activeBottomNav === 'weighing_sampling' ? (
                        // --- Weighing/Sampling View ---
                        <div className="space-y-4">
                            {/* Primary Tabs (Sampling/Weighing) */}
                            <div className="flex bg-surface-container p-1 rounded-full border border-outline/50">
                                <TabButton label="સેમ્પલિંગ" isActive={activeWeighingSamplingTab === 'sampling'} onClick={() => setActiveWeighingSamplingTab('sampling')} />
                                <TabButton label="વજન" isActive={activeWeighingSamplingTab === 'weighing'} onClick={() => setActiveWeighingSamplingTab('weighing')} />
                            </div>

                            {/* Secondary Search/Filter Bar (Only for Weighing/Sampling view) */}
                            <SecondaryFilterBar searchTerm={secondarySearchTerm} setSearchTerm={setSecondarySearchTerm} />

                            {/* Render content based on activeWeighingSamplingTab */}
                            {activeWeighingSamplingTab === 'sampling' && (
                                <SamplingListsSection
                                    harvestedList={harvestedCycles}
                                    sampleCollectedList={sampleCollectedCycles}
                                />
                            )}
                            {activeWeighingSamplingTab === 'weighing' && (
                                <CollapsibleSection
                                    title={`વજન કરવાનું બાકી છે (${weighingTabCycles.length})`}
                                    isOpen={isWeighingListOpen}
                                    setIsOpen={setIsWeighingListOpen}
                                >
                                    <div className="space-y-3 pt-2">
                                        {weighingTabCycles.length > 0 ? (
                                            weighingTabCycles.map(cycle => (
                                                <CycleListItem // Renders items for the Weighing tab
                                                    key={cycle.crop_cycle_id}
                                                    cycle={cycle}
                                                    listType="weighing"
                                                    isWeighingOpen={currentlyWeighingCycleId === cycle.crop_cycle_id}
                                                    setCurrentlyWeighingCycleId={setCurrentlyWeighingCycleId}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-center text-on-surface-variant py-8">આ તબક્કા માટે કોઈ સાયકલ મળેલ નથી.</p>
                                        )}
                                    </div>
                                </CollapsibleSection>
                            )}
                        </div>
                    ) : (
                        // --- Loading View ---
                        <LoadingView
                            initialShipments={initialShipments}
                            cyclesReadyForLoading={cyclesReadyForLoading}
                            transportCompanies={transportCompanies}
                            destinationCompanies={destinationCompanies}
                            locationFilter={collectionMethodFilter} // Pass header filter down
                        />
                    )
                )}
            </main>

            {/* Bottom Nav: Controls activeBottomNav state */}
            <HarvestingBottomNav
                activeBottomNav={activeBottomNav}
                setActiveBottomNav={setActiveBottomNav} // Pass setter down
            />
        </div>
    );
}

// --- Sub-Components ---

// Secondary Filter Bar (Only shown in Weighing/Sampling view)
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
            {/* Filter button can be added back if needed */}
            {/* <button className="p-2 rounded-full hover:bg-primary/10">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
            </button> */}
        </div>
    );
}

// CycleListItem (Only for Weighing Tab list)
function CycleListItem({
    cycle,
    listType,
    isWeighingOpen,
    setCurrentlyWeighingCycleId
}: {
    cycle: CropCycleForEmployeeWeighing,
    listType: 'weighing',
    isWeighingOpen?: boolean,
    setCurrentlyWeighingCycleId?: (id: number | null) => void
}) {

    let actionElement = null;
    const buttonStyle = "h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all";

    // Show button only for 'Priced' status cycles
    if (cycle.status === 'Priced') {
        actionElement = (
            <button
                onClick={() => setCurrentlyWeighingCycleId?.(cycle.crop_cycle_id)}
                className={`${buttonStyle} bg-primary text-on-primary hover:shadow-md w-full sm:w-auto`}
            >
                <Scale className="w-4 h-4" /> વજન શરૂ કરો
            </button>
        );
    }
    // Weighed cycles are handled in Loading view, no action needed here.

    const statusDisplayMap: Record<string, string> = {
        'Priced': 'ભાવ નક્કી',
        // Add others if unexpected statuses appear, but focus should be 'Priced'
    };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status;

    return (
        <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            {/* Info + Call button */}
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

            {/* Action Button Area */}
            {actionElement && !isWeighingOpen && (
                <div className="mt-3 pt-3 border-t border-outline/20 flex justify-end">
                    {actionElement}
                </div>
            )}

             {/* Weighing Input Section */}
             {isWeighingOpen && (
                 <WeighingInputSection
                    cycle={cycle}
                    onCancel={() => setCurrentlyWeighingCycleId?.(null)}
                 />
            )}
        </div>
    );
}

// Search Results Section
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

// Search Result Item
function SearchResultItem({ cycle }: { cycle: CropCycleForEmployeeWeighing }) {
   // Minimal changes needed here, logic remains mostly the same
    const [isPending, startTransition] = useTransition();
    const [selectedCollectionMethod, setSelectedCollectionMethod] = useState(cycle.goods_collection_method || 'Farm');
    useEffect(() => { setSelectedCollectionMethod(cycle.goods_collection_method || 'Farm'); }, [cycle.goods_collection_method]);

    const handleConfirmHarvest = () => {
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

     // Helper function for markSampleCollected, needed within SearchResultItem scope
     const handleMarkSampleCollected = () => {
        if (cycle.status !== 'Harvested') return;
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        startTransition(async () => {
            const result = await harvestingActions.markSampleCollected(null, formData);
            if (result.success) { window.location.reload(); }
            else { alert(`Error: ${result.message || 'Failed to mark sample collected.'}`); }
        });
    };


    const collectionOptions = [ { value: 'Farm', label: 'ખેતર' }, { value: 'Parabadi yard', label: 'પરબડી યાર્ડ' }, { value: 'Dhoraji yard', label: 'ધોરાજી યાર્ડ' }, { value: 'Jalasar yard', label: 'જાળાસર યાર્ડ' } ];
    let nextActionElement = null;
    const buttonStyle = "w-full h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-md";
    const statusDisplayMap: Record<string, string> = { 'Harvested': 'લણણી કરેલ', 'Sample Collected': 'સેમ્પલ કલેક્ટેડ', 'Sampled': 'સેમ્પલ લેવાયું', 'Price Proposed': 'ભાવ પ્રસ્તાવિત', 'Priced': 'ભાવ નક્કી', 'Weighed': 'વજન પૂર્ણ', 'Growing': 'વાવેતર ચાલે છે' };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status;
    const displayReadyToHarvest = 'લણણી માટે તૈયાર';

    // Define actions based on cycle status
    switch (cycle.status) {
        case 'Growing':
            nextActionElement = (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:flex-1">
                        <div className="relative rounded-lg border border-outline bg-surface-container h-[40px]">
                            <select id={`collection-select-${cycle.crop_cycle_id}`} value={selectedCollectionMethod} onChange={(e) => setSelectedCollectionMethod(e.target.value)} className="w-full h-full pl-3 pr-8 rounded-lg bg-transparent appearance-none text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                                {collectionOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                        </div>
                    </div>
                    <button onClick={handleConfirmHarvest} disabled={isPending || !selectedCollectionMethod} className={`${buttonStyle} sm:w-auto bg-primary text-on-primary disabled:opacity-50`}>
                        {isPending ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <CheckSquare className="w-4 h-4" />} લણણીની પુષ્ટિ કરો
                    </button>
                </div>
            );
            break;
        case 'Harvested': // Action is now an ActionToggle
            nextActionElement = (
                <ActionToggle
                    label="સેમ્પલ કલેક્ટેડ"
                    onToggle={handleMarkSampleCollected}
                    isPending={isPending}
                    checked={false}
                />
            );
            break;
        case 'Sample Collected':
            nextActionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container`}><Beaker className="w-4 h-4" /> સેમ્પલ ડેટા દાખલ કરો</Link>;
            break;
        case 'Sampled':
            nextActionElement = <div className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-full w-full text-center block font-medium">એડમિનના ભાવ બાકી</div>;
            break;
        case 'Priced':
            nextActionElement = <div className="text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded-full w-full text-center block font-medium">વજન માટે તૈયાર</div>;
            break;
        case 'Weighed':
            nextActionElement = <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full w-full text-center block font-medium">લોડિંગ માટે તૈયાર ({cycle.bags_remaining_to_load ?? 0} બાકી)</div>;
            break;
        default:
            nextActionElement = <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full w-full text-center block font-medium">સ્થિતિ: {displayStatus}</div>;
    }

    return (
         <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            <div>
                <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
                <p className="text-xs mt-1 font-medium text-primary">{cycle.status === 'Growing' ? displayReadyToHarvest : displayStatus}</p>
            </div>
            {nextActionElement && ( <div className="mt-3 pt-3 border-t border-outline/20"> {nextActionElement} </div> )}
        </div>
     );
}

// Reusable Action Toggle Component (Needed by SearchResultItem)
const ActionToggle = ({ label, onToggle, isPending, checked = false }: {
    label: string,
    onToggle: () => void,
    isPending: boolean,
    checked?: boolean
}) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" onChange={onToggle} disabled={isPending} checked={checked} />
        <div className="relative w-11 h-6 bg-outline rounded-full peer peer-checked:bg-primary transition-colors duration-200 ease-in-out">
            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform duration-200 ease-in-out peer-checked:translate-x-full flex items-center justify-center`}>
                 {isPending && <LoaderCircle className="w-4 h-4 text-primary animate-spin" />}
            </div>
        </div>
        <span className="ml-3 text-sm font-medium text-on-surface-variant"> {isPending ? 'અપડેટ થઈ રહ્યું છે...' : `માર્ક કરો ${label}`} </span>
    </label>
);