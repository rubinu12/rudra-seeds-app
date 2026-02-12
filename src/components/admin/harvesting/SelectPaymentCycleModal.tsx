"use client";

import React, { useState, useTransition } from "react";
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

  const handleNavigate = (cycleId: number) => {
    setIsNavigatingId(cycleId);
    startTransition(() => {
      router.push(`/admin/payments/${cycleId}/process`);
      onClose();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Cycle for Farmer Payment"
      maxWidth="max-w-xl"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
            <p className="ml-2 text-on-surface-variant">
              Loading cycles ready for payment...
            </p>
          </div>
        ) : cycles.length > 0 ? (
          cycles.map((cycle) => (
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
            No cycles found with &apos;Loaded&apos; status ready for payment.
          </p>
        )}
      </div>
    </Modal>
  );
}