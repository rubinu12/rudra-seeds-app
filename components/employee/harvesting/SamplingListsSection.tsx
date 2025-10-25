// components/employee/harvesting/SamplingListsSection.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { CropCycleForEmployeeWeighing } from '@/lib/definitions'; // Use extended type
import { LoaderCircle, ChevronDown, ChevronUp, Beaker, Scale, Phone } from 'lucide-react';
import * as harvestingActions from '@/app/employee/harvesting/actions'; // Import actions

type SamplingListsSectionProps = {
    harvestedList: CropCycleForEmployeeWeighing[];
    sampleCollectedList: CropCycleForEmployeeWeighing[];
};

// --- Main Component ---
export default function SamplingListsSection({
    harvestedList,
    sampleCollectedList
}: SamplingListsSectionProps) {
    const [isHarvestedListOpen, setIsHarvestedListOpen] = useState(true);
    const [isSampleCollectedListOpen, setIsSampleCollectedListOpen] = useState(true);

    return (
        <>
            {/* Collapsible List 1: Harvested */}
            <CollapsibleSection
                title={`સેમ્પલ કલેક્શન બાકી (${harvestedList.length})`}
                isOpen={isHarvestedListOpen}
                setIsOpen={setIsHarvestedListOpen}
            >
                <div className="space-y-3 pt-2">
                    {harvestedList.length > 0 ? (
                        harvestedList.map(cycle => (
                            <CycleListItem key={cycle.crop_cycle_id} cycle={cycle} listType="sampling" />
                        ))
                    ) : (
                        <p className="text-center text-on-surface-variant py-4 text-sm">કોઈ પાક સેમ્પલ કલેક્શન માટે બાકી નથી.</p>
                    )}
                </div>
            </CollapsibleSection>

            {/* Collapsible List 2: Sample Collected */}
            <CollapsibleSection
                title={`સેમ્પલ ડેટા એન્ટ્રી બાકી (${sampleCollectedList.length})`}
                isOpen={isSampleCollectedListOpen}
                setIsOpen={setIsSampleCollectedListOpen}
            >
                <div className="space-y-3 pt-2">
                    {sampleCollectedList.length > 0 ? (
                        sampleCollectedList.map(cycle => (
                            <CycleListItem key={cycle.crop_cycle_id} cycle={cycle} listType="sampling" />
                        ))
                    ) : (
                        <p className="text-center text-on-surface-variant py-4 text-sm">કોઈ પાક સેમ્પલ ડેટા એન્ટ્રી માટે બાકી નથી.</p>
                    )}
                </div>
            </CollapsibleSection>
        </>
    );
}


// --- Sub-Components (Moved here) ---

// Collapsible Section Component
function CollapsibleSection({ title, isOpen, setIsOpen, children }: {
    title: string,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    children: React.ReactNode
}) {
     return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-sm font-medium text-on-surface-variant px-2 py-2 hover:bg-surface-container rounded-md"
            >
                <span>{title}</span>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="mt-1">{children}</div>
            )}
        </div>
    );
}

// Cycle List Item (Specific to Sampling/Weighing lists)
// Note: Weighing-specific logic (like the input section) is not included here
// as this component is focused on the Sampling tab's display.
function CycleListItem({ cycle, listType }: { cycle: CropCycleForEmployeeWeighing, listType: 'sampling' | 'weighing' }) {
    const [isPending, startTransition] = useTransition();

    const handleMarkSampleCollected = () => {
        if (cycle.status !== 'Harvested') return;
        const formData = new FormData();
        formData.append('cropCycleId', String(cycle.crop_cycle_id));
        startTransition(async () => {
            const result = await harvestingActions.markSampleCollected(null, formData);
            if (result.success) { window.location.reload(); } // Consider router.refresh() later
            else { alert(`Error: ${result.message || 'Failed to mark sample collected.'}`); }
        });
    };

    let actionElement = null;
    const buttonStyle = "h-[40px] px-5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-all";

    // Action logic specific to the Sampling tab lists
    if (listType === 'sampling') {
        if (cycle.status === 'Harvested') {
             actionElement = (
                 <ActionToggle
                    label="સેમ્પલ કલેક્ટેડ"
                    onToggle={handleMarkSampleCollected}
                    isPending={isPending}
                    checked={false}
                 />
             );
        } else if (cycle.status === 'Sample Collected') {
            actionElement = <Link href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} className={`${buttonStyle} bg-secondary-container text-on-secondary-container hover:shadow-md`}><Beaker className="w-4 h-4" /> સેમ્પલ ડેટા દાખલ કરો</Link>;
        }
        // 'Sampled' status is handled implicitly (no action shown in these lists)
    }
    // We can add weighing logic here later if needed, but keeping it focused for now

    const statusDisplayMap: Record<string, string> = {
        'Harvested': 'લણણી કરેલ',
        'Sample Collected': 'સેમ્પલ કલેક્ટેડ',
        'Sampled': 'સેમ્પલ લેવાયું',
        'Price Proposed': 'ભાવ પ્રસ્તાવિત',
        'Priced': 'ભાવ નક્કી',
        'Weighed': 'વજન પૂર્ણ',
        'Growing': 'વાવેતર ચાલે છે'
     };
    const displayStatus = statusDisplayMap[cycle.status] || cycle.status;

    return (
        <div className="bg-surface rounded-2xl p-4 border border-outline/30 shadow-sm">
            <div className="flex justify-between items-start">
                 <div>
                    <p className="font-semibold text-lg text-on-surface">{cycle.farmer_name}</p>
                    {cycle.mobile_number ? (
                        <p className="flex items-center gap-1 text-sm text-on-surface-variant my-1">
                            <Phone className="w-3 h-3" />
                            {cycle.mobile_number}
                        </p>
                    ) : (
                         <p className="flex items-center gap-1 text-sm text-on-surface-variant/70 my-1 italic">
                            <Phone className="w-3 h-3" /> (No mobile)
                        </p>
                    )}
                    <p className="text-sm text-on-surface-variant">{cycle.seed_variety} • {cycle.farm_location}</p>
                    {/* Display Lot No and Landmark if available */}
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
                     >
                        <Phone className="w-5 h-5" />
                    </a>
                 )}
            </div>
            {actionElement && (
                <div className="mt-3 pt-3 border-t border-outline/20 flex justify-end">
                    {actionElement}
                </div>
            )}
        </div>
    );
}

// Reusable Action Toggle Component
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
        <div className="relative w-11 h-6 bg-outline rounded-full peer peer-checked:bg-primary transition-colors duration-200 ease-in-out">
            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform duration-200 ease-in-out peer-checked:translate-x-full flex items-center justify-center`}>
                 {isPending && <LoaderCircle className="w-4 h-4 text-primary animate-spin" />}
            </div>
        </div>
        <span className="ml-3 text-sm font-medium text-on-surface-variant">
            {isPending ? 'અપડેટ થઈ રહ્યું છે...' : `માર્ક કરો ${label}`}
        </span>
    </label>
);