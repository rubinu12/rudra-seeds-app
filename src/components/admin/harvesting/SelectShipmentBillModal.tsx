// components/admin/harvesting/SelectShipmentBillModal.tsx
"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/src/components/ui/Modal";
import { DispatchedShipmentInfo } from "@/src/lib/shipment-data"; // Use the new path
import {
  Truck,
  CalendarDays,
  ChevronRight,
  FileText,
  LoaderCircle,
} from "lucide-react";

type SelectShipmentBillModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shipments: DispatchedShipmentInfo[];
  isLoading?: boolean; // Optional loading state from parent
};

export default function SelectShipmentBillModal({
  isOpen,
  onClose,
  shipments,
  isLoading = false, // Default loading to false
}: SelectShipmentBillModalProps) {
  const router = useRouter();
  const [isNavigatingId, setIsNavigatingId] = useState<number | null>(null); // Track which item is navigating
  const [isPending, startTransition] = useTransition();

  const handleNavigate = (shipmentId: number) => {
    setIsNavigatingId(shipmentId); // Show spinner on the clicked item
    startTransition(() => {
      // Use router.push for client-side navigation
      router.push(`/admin/shipments/${shipmentId}/bill`);
      // No need to manually set isNavigatingId back to null here
      // as the modal will close or the component might unmount/remount.
      // We also close the modal immediately upon initiating navigation.
      onClose();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Shipment to Generate Bill"
      maxWidth="max-w-lg"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
            <p className="ml-2 text-on-surface-variant">Loading shipments...</p>
          </div>
        ) : shipments.length > 0 ? (
          shipments.map((shipment) => (
            <button
              key={shipment.shipment_id}
              onClick={() => handleNavigate(shipment.shipment_id)}
              disabled={isPending} // Disable all buttons during any navigation transition
              className="w-full flex justify-between items-center p-4 rounded-xl bg-surface hover:bg-surface-variant/60 border border-outline/20 transition-colors group shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* Left side content */}
              <div className="flex-grow min-w-0 text-left">
                <p className="font-semibold text-on-surface text-base truncate flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                  {shipment.vehicle_number ||
                    `Shipment #${shipment.shipment_id}`}
                </p>
                <p className="text-sm text-on-surface-variant truncate">
                  To: {shipment.destination_company_name || "N/A"}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Dispatched: {shipment.dispatch_date || "N/A"} (
                  {shipment.total_bags || 0} Bags)
                </p>
              </div>
              {/* Right side action */}
              <div className="flex items-center gap-1 text-primary flex-shrink-0">
                {isNavigatingId === shipment.shipment_id ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-sm font-medium hidden sm:inline group-hover:underline">
                      Generate Bill
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">
            No shipments found with 'Dispatched' status.
          </p>
        )}
      </div>
    </Modal>
  );
}
