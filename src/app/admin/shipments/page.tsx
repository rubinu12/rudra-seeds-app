"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  CheckCircle,
  Trash2,
  Printer,
  MapPin,
  Building,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
  Leaf,
  Users
} from "lucide-react";
import { toast } from "sonner";
import {
  getFilledShipments,
  getDispatchedShipments,
  confirmShipmentDispatch,
  deleteShipment,
  ShipmentData,
} from "@/src/app/admin/actions/adminShipment";

export default function AdminShipmentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingList, setPendingList] = useState<ShipmentData[]>([]);
  const [historyList, setHistoryList] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pending, history] = await Promise.all([
      getFilledShipments(),
      getDispatchedShipments(),
    ]);
    setPendingList(pending);
    setHistoryList(history);
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleConfirm = async (id: number) => {
    if (!confirm("Confirm Dispatch? This will generate the final bill."))
      return;
    setProcessingId(id);
    const res = await confirmShipmentDispatch(id);
    if (res.success) {
      toast.success("Dispatched!");
      loadData();
    } else {
      toast.error("Failed");
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: number) => {
    const msg =
      "⚠️ CRITICAL WARNING ⚠️\n\nThis will DELETE the shipment and RESTORE stock to all farmers.\nThis cannot be undone.\n\nProceed?";
    if (!confirm(msg)) return;

    setProcessingId(id);
    const res = await deleteShipment(id);
    if (res.success) {
      toast.success("Deleted & Restored");
      loadData();
    } else {
      toast.error("Failed");
    }
    setProcessingId(null);
  };

  const handlePrint = (s: ShipmentData) => {
    router.push(`/admin/shipments/${s.shipment_id}/print`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Shipment Control
          </h1>
          <p className="text-slate-500 font-medium">
            Manage dispatch, billing, and cancellations
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw
            className={`w-5 h-5 text-slate-600 ${
              loading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <TabButton
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          count={pendingList.length}
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Pending Review"
        />
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          icon={<Truck className="w-4 h-4" />}
          label="Dispatch History"
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          Loading shipments...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "pending" ? (
            pendingList.length > 0 ? (
              pendingList.map((s) => (
                <ShipmentCard
                  key={s.shipment_id}
                  data={s}
                  type="pending"
                  isProcessing={processingId === s.shipment_id}
                  onConfirm={() => handleConfirm(s.shipment_id)}
                  onDelete={() => handleDelete(s.shipment_id)}
                />
              ))
            ) : (
              <EmptyState msg="No shipments waiting for confirmation" />
            )
          ) : historyList.length > 0 ? (
            historyList.map((s) => (
              <ShipmentCard
                key={s.shipment_id}
                data={s}
                type="history"
                isProcessing={false}
                onPrint={() => handlePrint(s)}
              />
            ))
          ) : (
            <EmptyState msg="No dispatch history found" />
          )}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, label, icon, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 
                ${
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
    >
      {icon} {label}
      {count !== undefined && count > 0 && (
        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
      <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-400 font-bold">{msg}</p>
    </div>
  );
}

// --- CARD COMPONENT ---
function ShipmentCard({
  data,
  type,
  isProcessing,
  onConfirm,
  onDelete,
  onPrint,
}: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      {/* Header Status Strip */}
      <div
        className={`h-2 w-full ${
          type === "pending" ? "bg-orange-400" : "bg-green-500"
        }`}
      />

      <div className="p-5 flex-1">
        {/* Top Row */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">
              {data.vehicle_number}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
              <MapPin className="w-3 h-3" /> {data.location}
            </div>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-black text-slate-900">
              {data.total_bags}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Bags
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Building className="w-3 h-3" /> Dest:
            </span>
            <span className="font-bold text-slate-700 truncate max-w-[150px]">
              {data.company_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Trans:
            </span>
            <span className="font-bold text-slate-700 truncate max-w-[150px]">
              {data.transport_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3" /> Driver:
            </span>
            <span className="font-bold text-slate-700">{data.driver_name}</span>
          </div>

          {/* UPDATED: Variety Display */}
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Loaded:
            </span>
            <span className="font-bold text-slate-700">
              {data.loaded_varieties && data.loaded_varieties.length > 0 
                ? data.loaded_varieties.join(", ") 
                : "Unknown"}
            </span>
          </div>
          
          {/* NEW: Farmers Display */}
          <div className="flex justify-between items-start">
             <span className="text-slate-500 flex items-center gap-1 mt-0.5">
               <Users className="w-3 h-3" /> Farmers:
             </span>
             <span className="font-bold text-slate-700 text-right max-w-[150px] line-clamp-2">
                {data.farmer_names && data.farmer_names.length > 0 
                 ? data.farmer_names.join(", ") 
                 : "-"}
             </span>
           </div>

          {type === "history" && (
            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Dispatched:
              </span>
              <span className="font-bold text-green-700">
                {new Date(data.dispatch_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-4 pt-0 mt-auto flex gap-2">
        {type === "pending" ? (
          <>
            <button
              onClick={onDelete}
              disabled={isProcessing}
              className="px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Confirm Dispatch
                </>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onPrint}
            className="w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Bill
          </button>
        )}
      </div>
    </div>
  );
}