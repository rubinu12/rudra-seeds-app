// components/employee/harvesting/HarvestingBottomNav.tsx
"use client";

import { Package, Wheat } from 'lucide-react';
import React from 'react';

type BottomNavTab = 'weighing_sampling' | 'loading';

type HarvestingBottomNavProps = {
    activeBottomNav: BottomNavTab;
    setActiveBottomNav: (tab: BottomNavTab) => void;
};

// Internal reusable component for nav items
function BottomNavItem({ label, icon: Icon, isActive, onClick }: {
    label: string,
    icon: React.ElementType,
    isActive: boolean,
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center pt-1 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
            <Icon className="w-6 h-6 mb-1"/>
            <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
        </button>
    );
}


export default function HarvestingBottomNav({ activeBottomNav, setActiveBottomNav }: HarvestingBottomNavProps) {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-10 bg-surface/90 backdrop-blur-sm border-t border-outline/30">
            <nav className="max-w-xl mx-auto flex h-16">
                <BottomNavItem
                    label="વજન/સેમ્પલિંગ"
                    icon={Wheat} // Use Wheat for Weighing/Sampling
                    isActive={activeBottomNav === 'weighing_sampling'}
                    onClick={() => setActiveBottomNav('weighing_sampling')}
                />
                <BottomNavItem
                    label="લોડિંગ"
                    icon={Package} // Use Package for Loading
                    isActive={activeBottomNav === 'loading'}
                    onClick={() => setActiveBottomNav('loading')}
                />
            </nav>
        </footer>
    );
}