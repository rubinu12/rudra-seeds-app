// components/admin/harvesting/SampleEntryModal.tsx
"use client";

import Modal from '@/components/ui/Modal';
import { CycleForSampleEntry } from '@/lib/admin-data'; // Import the type
import Link from 'next/link';
import { ChevronRight, FlaskConical } from 'lucide-react'; // Added FlaskConical icon

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForSampleEntry[]; // Accept the list of cycles as a prop
};

export default function SampleEntryModal({ isOpen, onClose, cycles }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cycles Pending Sample Data Entry">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {cycles.length > 0 ? (
          cycles.map((cycle) => (
            <Link
              key={cycle.crop_cycle_id}
              href={`/employee/harvesting/sample/${cycle.crop_cycle_id}`} // Link to the specific sample entry page
              className="block p-4 rounded-lg bg-surface hover:bg-surface-container border border-outline/30 transition-colors group"
              onClick={onClose} // Close modal on click
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-on-surface">{cycle.farmer_name}</p>
                  <p className="text-sm text-on-surface-variant">{cycle.seed_variety}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Sample collected on: {cycle.sample_collection_date ? new Date(cycle.sample_collection_date).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary group-hover:underline">
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