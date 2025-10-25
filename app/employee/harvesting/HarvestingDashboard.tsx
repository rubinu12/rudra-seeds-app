// app/employee/harvesting/HarvestingDashboard.tsx
"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
// Ensure CropCycleForEmployee includes status and goods_collection_method
import { CropCycleForEmployee } from '@/lib/definitions';
import { Search, LoaderCircle, ChevronDown, SlidersHorizontal, PackageCheck, Scale, AlertTriangle, CheckSquare, Package, Wheat, Beaker } from 'lucide-react';
import * as harvestingActions from './actions';
import SearchableSelect from '@/components/ui/SearchableSelect';

// Define the shape of the data passed to the dashboard
type Props = {
    // Combined list for sampling tab actions
    cyclesToSample: CropCycleForEmployee[]; // Should contain cycles with status 'Harvested' OR 'Sample Collected'
    cyclesToWeigh: CropCycleForEmployee[]; // Cycles with status 'Priced'
};

// Define possible collection methods including 'All' in English for value, Gujarati for display?
// Sticking to English values for consistency with DB/logic, display can be Gujarati if needed in component
type CollectionMethod = 'All' | 'Farm' | 'Parabadi yard' | 'Dhoraji yard' | 'Jalasar yard';
const collectionMethods: CollectionMethod[] = ['All', 'Farm', 'Parabadi yard', 'Dhoraji yard', 'Jalasar yard'];
const collectionMethodLabels: Record<CollectionMethod, string> = {
    'All': 'બધા',
    'Farm': 'ખેતર',
    'Parabadi yard': 'પરબડી યાર્ડ',
    'Dhoraji yard': 'ધોરાજી યાર્ડ',
    'Jalasar yard': 'જાળાસર યાર્ડ'
};


// --- Main Dashboard Component ---
export default function HarvestingDashboard({ cyclesToSample, cyclesToWeigh }: Props) {
    const [mainSearchTerm, setMainSearchTerm] = useState('');
    const [mainSearchResults, setMainSearchResults] = useState<CropCycleForEmployee[]>([]);
    const [isMainSearchLoading, setIsMainSearchLoading] = useState(false);
    const debouncedMainSearchTerm = useDebounce(mainSearchTerm, 350);

    const [activeListTab, setActiveListTab] = useState<'sampling' | 'weighing'>('sampling');

    const [collectionMethodFilter, setCollectionMethodFilter] = useState<CollectionMethod>('All');
    const [lastWeighingFilter, setLastWeighingFilter] = useState<CollectionMethod>('All');

    const [secondarySearchTerm, setSecondarySearchTerm] = useState('');
    const [secondaryFilters, setSecondaryFilters] = useState({}); // Placeholder

    const [activeBottomNav, setActiveBottomNav] = useState<'weighing_sampling' | 'loading'>('weighing_sampling');

    // Effect for handling main search API calls
    useEffect(() => {
        if (debouncedMainSearchTerm) {
            setIsMainSearchLoading(true);
            fetch(`/api/cycles/search?query=${debouncedMainSearchTerm}`)
                .then(res => res.json())
                .then((data: CropCycleForEmployee[]) => {
                    const resultsWithDefaults = data.map(cycle => ({
                        ...cycle,
                        goods_collection_method: cycle.goods_collection_method || 'Farm'
                    }));
                    setMainSearchResults(resultsWithDefaults);
                })
                .catch(err => { console.error("Failed to fetch main search results:", err); setMainSearchResults([]); })
                .finally(() => setIsMainSearchLoading(false));
        } else {
            setMainSearchResults([]);
        }
    }, [debouncedMainSearchTerm]);

    // Effect to manage the collectionMethodFilter based on the active tab
    useEffect(() => {
        if (activeListTab === 'sampling') {
            setCollectionMethodFilter('All');
        } else {
            setCollectionMethodFilter(lastWeighingFilter);
        }
    }, [activeListTab, lastWeighingFilter]);

    // Handle changes in the header collection method dropdown
    const handleCollectionFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value as CollectionMethod;
        setCollectionMethodFilter(newValue);
        if (activeListTab === 'weighing') {
            setLastWeighingFilter(newValue); // Remember this filter for weighing
        }
    };

    const isMainSearchActive = mainSearchTerm.length > 0;

    // Filter the weighing list based on the header dropdown
    const filteredWeighingList = useMemo(() => {
        if (collectionMethodFilter === 'All') {
            return cyclesToWeigh;
        }
        return cyclesToWeigh.filter(cycle => cycle.goods_collection_method === collectionMethodFilter);
    }, [cyclesToWeigh, collectionMethodFilter]);

    // --- Separate Sampling Lists ---
    const harvestedCycles = useMemo(() => cyclesToSample.filter(c => c.status === 'Harvested'), [cyclesToSample]);
    const sampleCollectedCycles = useMemo(() => cyclesToSample.filter(c => c.status === 'Sample Collected'), [cyclesToSample]);

    // Filter lists based on secondary search/filters (Applied within TabbedListSection now)


    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* --- Sticky Header --- */}
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
                            disabled={activeListTab === 'sampling' && !isMainSearchActive}
                            className={`w-full h-10 px-3 pr-8 rounded-full border text-sm appearance-none focus:outline-none focus:ring-1 ${activeListTab === 'sampling' && !isMainSearchActive ? 'bg-outline/10 border-outline/30 text-on-surface-variant cursor-not-allowed ring-transparent' : 'bg-surface-container border-outline text-on-surface focus:border-primary ring-primary/50'}`}
                         >
                            {collectionMethods.map(method => (
                                <option key={method} value={method}>{collectionMethodLabels[method]}</option> // Use Gujarati Labels
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                    </div>
                    <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-semibold shrink-0">
                        EM
                    </div>
                </div>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-grow p-4 max-w-xl mx-auto w-full space-y-4 pb-20">
                {/* Main Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="ખેડૂતનું નામ / ફોન શોધો..." // Gujarati Placeholder
                        value={mainSearchTerm}
                        onChange={(e) => setMainSearchTerm(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-full border-2 border-outline bg-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <div className="absolute top-0 left-0 h-14 w-12 grid place-items-center pointer-events-none">
                        {isMainSearchLoading ? (
                            <LoaderCircle className="w-5 h-5 text-on-surface-variant animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-on-surface-variant" />
                        )}
                    </div>
                </div>

                {/* Conditional Rendering */}
                {isMainSearchActive ? (
                    <SearchResultsSection
                        results={mainSearchResults}
                        isLoading={isMainSearchLoading}
                        searchTerm={debouncedMainSearchTerm}
                    />
                ) : (
                    <TabbedListSection
                        activeTab={activeListTab}
                        setActiveTab={setActiveListTab}
                        // Pass separated lists for sampling tab
                        harvestedList={harvestedCycles}
                        sampleCollectedList={sampleCollectedCycles}
                        weighingList={filteredWeighingList} // Pass filtered list for weighing
                        secondarySearchTerm={secondarySearchTerm}
                        setSecondarySearchTerm={setSecondarySearchTerm}
                    />
                )}
            </main>

            {/* --- Bottom Navigation --- */}
            <footer className="fixed bottom-0 left-0 right-0 z-10 bg-surface/90 backdrop-blur-sm border-t border-outline/30">
                <nav className="max-w-xl mx-auto flex h-16">
                    <BottomNavItem
                        label="વજન/સેમ્પલિંગ" // Gujarati Label
                        isActive={activeBottomNav === 'weighing_sampling'}
                        onClick={() => setActiveBottomNav('weighing_sampling')}
                    />
                    <BottomNavItem
                        label="લોડિંગ" // Gujarati Label
                        isActive={activeBottomNav === 'loading'}
                        onClick={() => setActiveBottomNav('loading')}
                    />
                </nav>
            </footer>
        </div>
    );
}

// --- Sub-Components ---

// --- UPDATED Section for Tabbed Lists ---
function TabbedListSection({
    activeTab,
    setActiveTab,
    harvestedList,          // New prop
    sampleCollectedList,    // New prop
    weighingList,
    secondarySearchTerm,
    setSecondarySearchTerm
}: {
    activeTab: 'sampling' | 'weighing',
    setActiveTab: (tab: 'sampling' | 'weighing') => void,
    harvestedList: CropCycleForEmployee[],     // List for sample collection toggle
    sampleCollectedList: CropCycleForEmployee[], // List for sample data entry button
    weighingList: CropCycleForEmployee[],      // List for weighing
    secondarySearchTerm: string,
    setSecondarySearchTerm: (term: string) => void
}) {
    // Apply secondary filtering to the relevant lists
    const filterFn = (cycle: CropCycleForEmployee) => cycle.farmer_name.toLowerCase().includes(secondarySearchTerm.toLowerCase());
    const displayedHarvestedList = harvestedList.filter(filterFn);
    const displayedSampleCollectedList = sampleCollectedList.filter(filterFn);
    const displayedWeighingList = weighingList.filter(filterFn);

    return (
        <div className="space-y-4">
            {/* Primary Tabs */}
            <div className="flex bg-surface-container p-1 rounded-full border border-outline/50">
                <TabButton label="સેમ્પલિંગ" isActive={activeTab === 'sampling'} onClick={() => setActiveTab('sampling')} />
                <TabButton label="વજન" isActive={activeTab === 'weighing'} onClick={() => setActiveTab('weighing')} />
            </div>

            {/* Secondary Search/Filter Bar */}
            <SecondaryFilterBar searchTerm={secondarySearchTerm} setSearchTerm={setSecondarySearchTerm} />

            {/* Conditional List Rendering based on activeTab */}
            {activeTab === 'sampling' && (
                <>
                    {/* List 1: Harvested (for toggle) */}
                    <h2 className="text-sm font-medium text-on-surface-variant px-2 pt-2">સેમ્પલ કલેક્શન બાકી ({displayedHarvestedList.length})</h2>
                    <div className="space-y-3">
                        {displayedHarvestedList.length > 0 ? (
                            displayedHarvestedList.map(cycle => (
                                <CycleListItem key={cycle.crop_cycle_id} cycle={cycle} listType="sampling" />
                            ))
                        ) : (
                            <p className="text-center text-on-surface-variant py-4 text-sm">કોઈ પાક સેમ્પલ કલેક્શન માટે બાકી નથી.</p>
                        )}
                    </div>

                    {/* Divider (Optional) */}
                     <hr className="border-outline/20 my-4"/>

                     {/* List 2: Sample Collected (for button) */}
                     <h2 className="text-sm font-medium text-on-surface-variant px-2">સેમ્પલ ડેટા એન્ટ્રી બાકી ({displayedSampleCollectedList.length})</h2>
                    <div className="space-y-3">
                        {displayedSampleCollectedList.length > 0 ? (
                            displayedSampleCollectedList.map(cycle => (
                                <CycleListItem key={cycle.crop_cycle_id} cycle={cycle} listType="sampling" />
                            ))
                        ) : (
                            <p className="text-center text-on-surface-variant py-4 text-sm">કોઈ પાક સેમ્પલ ડેટા એન્ટ્રી માટે બાકી નથી.</p>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'weighing' && (
                 <>
                    <h2 className="text-sm font-medium text-on-surface-variant px-2 pt-2">વજન કરવાનું બાકી છે ({displayedWeighingList.length})</h2>
                    <div className="space-y-3">
                        {displayedWeighingList.length > 0 ? (
                            displayedWeighingList.map(cycle => (
                                <CycleListItem key={cycle.crop_cycle_id} cycle={cycle} listType="weighing" />
                            ))
                        ) : (
                             <p className="text-center text-on-surface-variant py-8">આ તબક્કા માટે કોઈ સાયકલ મળેલ નથી.</p>
                        )}
                    </div>
                 </>
            )}
        </div>
    );
}

// Tab Button Component (Updated Label Prop)
function TabButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 px-4 rounded-full text-sm font-medium text-center transition-colors ${isActive ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-primary/10'}`}
        >
            {label} {/* Label passed directly */}
        </button>
    );
}

// Secondary Filter Bar (Updated Placeholder)
function SecondaryFilterBar({ searchTerm, setSearchTerm }: { searchTerm: string, setSearchTerm: (term: string) => void }) {
    return (
        <div className="relative flex items-center gap-2 bg-surface-container p-2 rounded-xl border border-outline/50">
            <Search className="w-5 h-5 text-on-surface-variant ml-2 flex-shrink-0" />
            <input
                type="text"
                placeholder="યાદીમાં શોધો..." // Gujarati Placeholder
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-transparent focus:outline-none text-sm h-8"
            />
            {/* Placeholder for actual filter button */}
            <button className="p-2 rounded-full hover:bg-primary/10">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
            </button>
        </div>
    );
}

// Cycle List Item (Updated Action Labels, Status Display)
function CycleListItem({ cycle, listType }: { cycle: CropCycleForEmployee, listType: 'sampling' | 'weighing' }) {
    const [isPending, startTransition] = useTransition();

    const handleMarkSampleCollected = () => {
        if (cycle.status !== 'Harvested') return;
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        startTransition(async () => {
            const result = await harvestingActions.markSampleCollected(null as any, formData);
            if (result.success) { window.location.reload(); }
            else { alert(`Error: ${result.message || 'Failed to mark sample collected.'}`); }
        });
    };

    let actionElement = null;
    const buttonStyle = "btn-primary h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all";

    // Display appropriate action based on status *within the correct tab*
    if (listType === 'sampling') {
        if (cycle.status === 'Harvested') {
             actionElement = (
                 <ActionToggle
                    label="સેમ્પલ કલેક્ટેડ" // Gujarati Label
                    onToggle={handleMarkSampleCollected}
                    isPending={isPending}
                    checked={false}
                 />
             );
        } else if (cycle.status === 'Sample Collected') {
            actionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container hover:shadow-md`}><Beaker className="w-4 h-4" /> સેમ્પલ ડેટા દાખલ કરો</Link>; // Gujarati Label
        } else if (cycle.status === 'Sampled') {
             actionElement = <div className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-full w-full text-center block font-medium">એડમિનના ભાવ બાકી</div>; // Gujarati Label
        }
    } else if (listType === 'weighing') {
        if (cycle.status === 'Priced') {
             actionElement = <button className={`${buttonStyle} bg-primary text-on-primary hover:shadow-md`}><Scale className="w-4 h-4" /> વજન શરૂ કરો</button>; // Gujarati Label
        } else if (cycle.status === 'Weighed') {
             actionElement = <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full w-full text-center block font-medium">વજન પૂર્ણ</div>; // Gujarati Label
         }
    }

    // Map status codes to Gujarati display text (add more as needed)
    const statusDisplayMap: Record<string, string> = {
        'Harvested': 'લણણી કરેલ',
        'Sample Collected': 'સેમ્પલ કલેક્ટેડ',
        'Sampled': 'સેમ્પલ લેવાયું',
        'Price Proposed': 'ભાવ પ્રસ્તાવિત',
        'Priced': 'ભાવ નક્કી',
        'Weighed': 'વજન પૂર્ણ',
        'Growing': 'વાવેતર ચાલે છે'
        // Add other statuses
    };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status; // Fallback to original status

    return (
        <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            <div>
                <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
                {listType === 'weighing' && (
                     <p className="text-xs text-on-surface-variant mt-1">અહીંથી લો: {cycle.goods_collection_method || 'N/A'}</p> // Gujarati Label
                 )}
                 {/* Show Gujarati Status */}
                 <p className="text-xs mt-1 font-medium text-primary">{displayStatus}</p>
            </div>
            {actionElement && (
                <div className="mt-3 pt-3 border-t border-outline/20 flex justify-end">
                    {actionElement}
                </div>
            )}
        </div>
    );
}

// Search Results Section (Updated Labels)
function SearchResultsSection({ results, isLoading, searchTerm }: { results: CropCycleForEmployee[], isLoading: boolean, searchTerm: string }) {
    return (
        <div className="space-y-3">
             <h2 className="text-sm font-medium text-on-surface-variant px-2">શોધ પરિણામો ({results.length})</h2> {/* Gujarati Label */}
            {isLoading && (
                 <div className="flex justify-center items-center py-10">
                    <LoaderCircle className="w-8 h-8 text-primary animate-spin" />
                 </div>
            )}
            {!isLoading && results.length === 0 && searchTerm && (
                <p className="text-center text-on-surface-variant py-8">"{searchTerm}" થી મેળ ખાતા કોઈ ખેડૂત મળ્યા નથી.</p> // Gujarati Label
            )}
             {!isLoading && results.length > 0 && (
                results.map(cycle => (
                    <SearchResultItem key={cycle.crop_cycle_id} cycle={cycle} />
                ))
             )}
        </div>
    );
}

// Search Result Item (Updated Labels and Status Display)
function SearchResultItem({ cycle }: { cycle: CropCycleForEmployee }) {
    const [isPending, startTransition] = useTransition();
    const [selectedCollectionMethod, setSelectedCollectionMethod] = useState(cycle.goods_collection_method || 'Farm');

    useEffect(() => {
        setSelectedCollectionMethod(cycle.goods_collection_method || 'Farm');
    }, [cycle.goods_collection_method]);

    const handleConfirmHarvest = () => { /* ... action logic ... */ };

    const collectionOptions = [ // Keep values English, Labels Gujarati
        { value: 'Farm', label: 'ખેતર' },
        { value: 'Parabadi yard', label: 'પરબડી યાર્ડ' },
        { value: 'Dhoraji yard', label: 'ધોરાજી યાર્ડ' },
        { value: 'Jalasar yard', label: 'જાળાસર યાર્ડ' },
    ];

    let nextActionElement = null;
    const buttonStyle = "w-full h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-md";

    // Map status codes to Gujarati display text (as defined in CycleListItem)
     const statusDisplayMap: Record<string, string> = { /* ... as above ... */
         'Harvested': 'લણણી કરેલ',
         'Sample Collected': 'સેમ્પલ કલેક્ટેડ',
         'Sampled': 'સેમ્પલ લેવાયું',
         'Price Proposed': 'ભાવ પ્રસ્તાવિત',
         'Priced': 'ભાવ નક્કી',
         'Weighed': 'વજન પૂર્ણ',
         'Growing': 'વાવેતર ચાલે છે'
     };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status;
    const displayReadyToHarvest = 'લણણી માટે તૈયાર'; // Gujarati

    switch (cycle.status) {
        case 'Growing':
            nextActionElement = (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-1/2">
                        <SearchableSelect
                            id={`collection-${cycle.crop_cycle_id}`}
                            name="goods_collection_method"
                            label="કલેક્શન પદ્ધતિ" // Gujarati Label
                            options={collectionOptions} // Use options with Gujarati labels
                            value={selectedCollectionMethod}
                            onChange={(value) => setSelectedCollectionMethod(value)}
                        />
                    </div>
                     <button
                        onClick={handleConfirmHarvest}
                        disabled={isPending}
                        className={`${buttonStyle} sm:w-1/2 bg-primary text-on-primary`}
                    >
                        {isPending ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <CheckSquare className="w-4 h-4" />}
                        લણણીની પુષ્ટિ કરો {/* Gujarati Label */}
                    </button>
                </div>
            );
            break;
        case 'Harvested':
            nextActionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container`}><PackageCheck className="w-4 h-4" /> સેમ્પલ લો</Link>; // Gujarati Label
            break;
        case 'Sample Collected':
             nextActionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container`}><Beaker className="w-4 h-4" /> સેમ્પલ ડેટા દાખલ કરો</Link>; // Gujarati Label
            break;
        case 'Sampled':
             nextActionElement = <div className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-full w-full text-center block font-medium">એડમિનના ભાવ બાકી</div>; // Gujarati Label
            break;
         case 'Priced':
            nextActionElement = <button className={`${buttonStyle} bg-primary text-on-primary`}><Scale className="w-4 h-4" /> વજન શરૂ કરો</button>; // Gujarati Label
            break;
        case 'Weighed':
             nextActionElement = <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full w-full text-center block font-medium">વજન પૂર્ણ</div>; // Gujarati Label
             break;
        default:
             nextActionElement = <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full w-full text-center block font-medium">સ્થિતિ: {displayStatus}</div>; // Gujarati Label
    }

    return (
         <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            <div>
                <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p>
                <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
                 {/* Show Gujarati Status */}
                 <p className="text-xs mt-1 font-medium text-primary">{cycle.status === 'Growing' ? displayReadyToHarvest : displayStatus}</p>
            </div>
            {nextActionElement && (
                <div className="mt-3 pt-3 border-t border-outline/20">
                    {nextActionElement}
                </div>
            )}
        </div>
    );
}

// Bottom Navigation Item (Updated Label Prop)
function BottomNavItem({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
            {/* Icons remain */}
            {label === 'લોડિંગ' ? <Package className="w-6 h-6 mb-1"/> : <Wheat className="w-6 h-6 mb-1"/>}
            <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span> {/* Label passed directly */}
        </button>
    );
}


// --- Reusable Action Toggle Component ---
const ActionToggle = ({ label, onToggle, isPending, checked = false }: {
    label: string,
    onToggle: () => void,
    isPending: boolean,
    checked?: boolean
}) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input
            type="checkbox"
            className="sr-only peer"
            onChange={onToggle}
            disabled={isPending}
            checked={checked}
        />
        {/* Simplified Toggle Switch styling */}
        <div className="relative w-11 h-6 bg-outline rounded-full peer peer-checked:bg-primary transition-colors duration-200 ease-in-out">
            {/* Moving Circle */}
            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform duration-200 ease-in-out peer-checked:translate-x-full flex items-center justify-center`}>
                 {/* Loader inside the circle when pending */}
                 {isPending && <LoaderCircle className="w-4 h-4 text-primary animate-spin" />}
            </div>
        </div>
        <span className="ml-3 text-sm font-medium text-on-surface-variant">
            {/* Using the passed label directly (should be Gujarati) */}
            {isPending ? 'અપડેટ થઈ રહ્યું છે...' : `માર્ક કરો ${label}`}
        </span>
    </label>
);