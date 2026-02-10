// components/admin/harvesting/ShipmentSummaryCard.tsx
"use client";

import { useState } from "react";
import { ShipmentSummaryData, ShipmentSummaryItem } from "@/src/lib/admin-data"; // Import the types
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  IndianRupee,
  Banknote,
  ListChecks,
} from "lucide-react";
import Link from "next/link"; // Assuming you'll link the verification button later

type Props = {
  data: ShipmentSummaryData;
};

export default function ShipmentSummaryCard({ data }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (data.shipments.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % data.shipments.length);
    }
  };

  const handlePrev = () => {
    if (data.shipments.length > 0) {
      setCurrentIndex(
        (prevIndex) =>
          (prevIndex - 1 + data.shipments.length) % data.shipments.length,
      );
    }
  };

  const currentShipment =
    data.shipments.length > 0 ? data.shipments[currentIndex] : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-surface-container rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[250px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-medium text-on-surface">
              Shipment Summary
            </h3>
            <p className="text-sm text-on-surface-variant">
              Track outgoing goods
            </p>
          </div>
          <Truck className="w-6 h-6 text-primary flex-shrink-0" />
        </div>

        {/* Shipment Carousel Section */}
        {currentShipment ? (
          <div className="relative mb-4">
            <div className="text-center p-4 bg-surface rounded-lg border border-outline/20">
              <p className="font-semibold text-lg text-on-surface truncate">
                {currentShipment.destinationCompany}
              </p>
              <div className="flex justify-around mt-2 text-xs text-on-surface-variant">
                <span>
                  Sent: {formatCurrency(currentShipment.totalValueSent)}
                </span>
                <span>
                  Received:{" "}
                  {formatCurrency(currentShipment.totalPaymentReceived)}
                </span>
              </div>
            </div>
            {data.shipments.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/5 hover:bg-black/10 text-on-surface-variant"
                  aria-label="Previous Shipment"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/5 hover:bg-black/10 text-on-surface-variant"
                  aria-label="Next Shipment"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-on-surface-variant my-8">
            No shipment data available.
          </p>
        )}
      </div>

      {/* Cheque Verification Section */}
      {/* TODO: Replace '#' with the actual link to the verification page */}
      <Link href="#" className="w-full">
        <button className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors text-sm font-medium">
          <ListChecks className="w-5 h-5" />
          {data.chequesToVerifyCount > 0
            ? `${data.chequesToVerifyCount} Cheques to Verify`
            : "Verify Cheques"}
        </button>
      </Link>
    </div>
  );
}
