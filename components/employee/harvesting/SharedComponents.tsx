// components/employee/harvesting/SharedComponents.tsx
"use client";

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Tab Button Component
export function TabButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 px-4 rounded-full text-sm font-medium text-center transition-colors ${isActive ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-primary/10'}`}
        >
            {label}
        </button>
    );
}

// Collapsible Section Component
export function CollapsibleSection({ title, isOpen, setIsOpen, children }: {
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