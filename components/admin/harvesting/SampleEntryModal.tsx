// components/admin/harvesting/SampleEntryModal.tsx
"use client";

import Modal from '@/components/ui/Modal';
import type { CycleForSampleEntry } from '@/lib/definitions';
import Link from 'next/link';
import { ChevronRight, FlaskConical } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForSampleEntry[];
};

export default function SampleEntryModal({ isOpen, onClose, cycles }: Props) {
  return (
    // Use larger default width for this list modal
    <Modal isOpen={isOpen} onClose={onClose} title="Cycles Pending Sample Data Entry" maxWidth="max-w-lg">
      <div className="space-y-4"> {/* Increased spacing between items */}
        {cycles.length > 0 ? (
          cycles.map((cycle) => (
            <Link
              key={cycle.crop_cycle_id}
              href={`/employee/harvesting/sample/${cycle.crop_cycle_id}?role=Admin`}
              // Refined styling for M3 list item appearance
              className="block p-4 rounded-xl bg-surface hover:bg-surface-variant/60 border border-outline/20 transition-colors group shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" // Use rounded-xl, adjust hover, add focus ring
              onClick={onClose}
            >
              <div className="flex justify-between items-center gap-4"> {/* Added gap */}
                {/* Left side content */}
                <div className="flex-grow min-w-0"> {/* Allow text to wrap/truncate */}
                  <p className="font-semibold text-on-surface text-base truncate">{cycle.farmer_name}</p> {/* Use text-base, truncate */}
                  <p className="text-sm text-on-surface-variant truncate">{cycle.crop_cycle_id} • {cycle.seed_variety}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Sample collected: {cycle.sample_collection_date ? new Date(cycle.sample_collection_date).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                </div>
                {/* Right side action */}
                <div className="flex items-center gap-1 text-primary flex-shrink-0 group-hover:underline">
                    <FlaskConical className="w-4 h-4" />
                    <span className="text-sm font-medium">Enter Data</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">
            No cycles are currently waiting for sample data entry.
          </p>
        )}
      </div>
    </Modal>
  );
}