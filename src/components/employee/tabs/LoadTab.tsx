"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Truck,
  Leaf,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import {
  ActiveShipment,
} from "@/src/app/employee/actions/shipments";
import NewShipmentModal, { MasterData } from "@/src/components/employee/loading/NewShipmentModal";

export default function LoadTab({ 
  location, 
  initialData,
  masterData 
}: { 
  location: string;
  initialData: ActiveShipment[];
  masterData: MasterData | null; // Strict Type
}) {
  const router = useRouter();
  const shipments = initialData;
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOthersOpen, setIsOthersOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh(); 
  };

  const isLocationMatch = (itemLoc: string) => {
    const current = location.toLowerCase().replace(" yard", "").trim();
    const item = (itemLoc || "").toLowerCase().replace(" yard", "").trim();
    return item.includes(current);
  };

  const assignedList = shipments.filter((s) => isLocationMatch(s.location));
  const otherList = shipments.filter((s) => !isLocationMatch(s.location));

  return (
    <div className="space-y-4 pb-24 animate-in fade-in">
      <button
        onClick={() => setIsCreateOpen(true)}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5" />
        New Truck Arrival
      </button>

      {assignedList.length > 0 ? (
        assignedList.map((s) => (
          <TruckCard
            key={s.shipment_id}
            s={s}
            onClick={() =>
              router.push(`/employee/shipment/${s.shipment_id}`)
            }
          />
        ))
      ) : (
        <div className="py-8 text-center opacity-50">
          <Truck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            No trucks at {location}
          </p>
        </div>
      )}

      {otherList.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setIsOthersOpen(!isOthersOpen)}
            className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-200"
          >
            <span className="text-xs font-bold uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Other Yards (
              {otherList.length})
            </span>
            {isOthersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isOthersOpen && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
              {otherList.map((s) => (
                <TruckCard
                  key={s.shipment_id}
                  s={s}
                  onClick={() =>
                    router.push(`/employee/shipment/${s.shipment_id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <NewShipmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        location={location}
        onSuccess={handleRefresh}
        masterData={masterData}
      />
    </div>
  );
}

function TruckCard({ s, onClick }: { s: ActiveShipment; onClick: () => void }) {
  const [isLoading, setIsLoading] = useState(false); 

  const handleClick = () => {
    setIsLoading(true); 
    onClick(); 
  };

  const remaining = s.target_bag_capacity - s.total_bags;
  const isOver = remaining < 0;

  return (
    <div
      onClick={handleClick}
      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all cursor-pointer relative overflow-hidden
        ${isLoading ? "opacity-60 pointer-events-none" : "active:scale-[0.98]"} 
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
           <LoaderCircle className="w-8 h-8 animate-spin text-slate-900" />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-xl">
            {s.vehicle_number}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
            <MapPin className="w-3 h-3" />
            {s.location}
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-2xl font-black ${
              isOver ? "text-orange-500" : "text-slate-900"
            }`}
          >
            {Math.abs(remaining)}
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {isOver ? "Extra" : "Left"}
          </p>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 ${
            isOver ? "bg-orange-500" : "bg-blue-600"
          }`}
          style={{
            width: `${Math.min(
              (s.total_bags / s.target_bag_capacity) * 100,
              100
            )}%`,
          }}
        />
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
        <Leaf className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-xs font-bold text-slate-600 truncate">
          {s.seed_varieties.join(", ")}
        </span>
      </div>
    </div>
  );
}