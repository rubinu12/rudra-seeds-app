// src/components/admin/harvesting/SelectPaymentCycleModal.tsx
"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/src/components/ui/Modal";
import { CycleForPaymentSelection } from "@/src/app/admin/payments/actions";
import {
  Wheat,
  User,
  Tag,
  Package,
  ChevronRight,
  LoaderCircle,
  Search, // NEW: Imported Search icon
  X       // NEW: Imported X icon to clear/close search
} from "lucide-react";

type SelectPaymentCycleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cycles: CycleForPaymentSelection[];
  isLoading?: boolean;
};

export default function SelectPaymentCycleModal({
  isOpen,
  onClose,
  cycles,
  isLoading = false,
}: SelectPaymentCycleModalProps) {
  const router = useRouter();
  const [isNavigatingId, setIsNavigatingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- NEW: Search State ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleNavigate = (cycleId: number) => {
    setIsNavigatingId(cycleId);
    startTransition(() => {
      router.push(`/admin/payments/${cycleId}/process`);
      onClose();
    });
  };

  // --- NEW: Local Filter Logic ---
  const filteredCycles = useMemo(() => {
    if (!searchQuery.trim()) return cycles;
    return cycles.filter((cycle) =>
      cycle.farmer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cycles, searchQuery]);

  // --- NEW: Custom Header for the Modal ---
  const ModalHeader = (
    <div className="flex items-center justify-between w-full h-8 mr-4">
      {isSearchActive ? (
        <div className="flex items-center w-full bg-surface-variant/50 border border-outline/20 rounded-lg px-3 py-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
          <Search className="w-4 h-4 text-on-surface-variant mr-2 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search farmer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none flex-grow text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-0"
          />
          <button
            onClick={() => {
              setIsSearchActive(false);
              setSearchQuery(""); // Clear search when closing bar
            }}
            className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-medium text-on-surface truncate">
            Select Cycle for Payment
          </h2>
          <button
            onClick={() => setIsSearchActive(true)}
            className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors ml-2 flex-shrink-0"
            title="Search by Farmer Name"
          >
            <Search className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setIsSearchActive(false); // Reset search state on modal close
        setSearchQuery("");
      }}
      title={ModalHeader} // Passed custom header here
      maxWidth="max-w-xl"
    >
      <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto p-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
            <p className="ml-2 text-on-surface-variant">
              Loading cycles ready for payment...
            </p>
          </div>
        ) : filteredCycles.length > 0 ? (
          filteredCycles.map((cycle) => (
            <button
              key={cycle.crop_cycle_id}
              onClick={() => handleNavigate(cycle.crop_cycle_id)}
              disabled={isPending}
              className="w-full flex justify-between items-center p-4 rounded-xl bg-surface hover:bg-surface-variant/60 border border-outline/20 transition-colors group shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="flex-grow min-w-0 text-left space-y-1">
                <p className="font-semibold text-on-surface text-base truncate flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary flex-shrink-0" />
                  {cycle.farmer_name}
                </p>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1 truncate">
                    <Tag className="w-3 h-3" /> Lot: {cycle.lot_no || "N/A"}
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <Wheat className="w-3 h-3" /> {cycle.seed_variety}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />{" "}
                    {cycle.quantity_in_bags || 0} Bags
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary flex-shrink-0">
                {isNavigatingId === cycle.crop_cycle_id ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-sm font-medium hidden sm:inline group-hover:underline">
                      Process Payment
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">
            {searchQuery 
              ? `No farmers found matching "${searchQuery}"` 
              : "No cycles found with 'Loaded' status ready for payment."}
          </p>
        )}
      </div>
    </Modal>
  );
}