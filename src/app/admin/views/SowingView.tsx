"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "@/src/components/admin/AdminProvider";
import WelcomeHeader from "@/src/components/admin/WelcomeHeader";
import KeyMetrics from "@/src/components/admin/KeyMetrics";
import {
  PlusCircle,
  Sprout,
  FileJson,
  Search,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getSowingData, SowingEntry } from "@/src/app/admin/actions/lotManagement";
import LotNumberModal from "@/src/components/admin/sowing/LotNumberModal";

export default function SowingView() {
  const { seasonLabel } = useAdmin();
  const router = useRouter();

  // --- DATA STATE ---
  const [data, setData] = useState<SowingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await getSowingData();
    setData(res);
    setLoading(false);
  };

  const handleStartNewCycle = () => {
    router.push("/admin/cycles/new");
  };

  // --- FILTERING ---
  const filtered = data.filter(
    (d) =>
      d.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      d.village_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.lot_no && d.lot_no.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <WelcomeHeader
        activeSeason="Sowing"
        onEnterSampleDataClick={() => {}}
        onSetTemporaryPriceClick={() => {}}
        onVerifyPriceClick={() => {}}
        onEditCycleClick={() => {}}
        onFinanceClick={handleStartNewCycle}
        onGenerateShipmentBillClick={() => {}}
        onProcessFarmerPaymentsClick={() => {}}
      />

      {/* 2. Main Action Card (Added Lot No Button Here) */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
            <Sprout className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Sowing Operations
            </h2>
            <p className="text-gray-500 text-sm">
              Manage sowing cycles and seed lots for {seasonLabel}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {/* NEW: Manage Lot Button */}
          <button
            onClick={() => setIsLotModalOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md"
          >
            <FileJson className="w-5 h-5" />
            Manage Lot No
          </button>

          {/* Existing: Add Cycle Button */}
          <button
            onClick={handleStartNewCycle}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 hover:shadow-lg transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Cycle
          </button>
        </div>
      </div>

      {/* 3. Metrics */}
      <div className="grid grid-cols-1 gap-6">
        <KeyMetrics />
      </div>

      {/* 4. Sowing List (Replaces Placeholder) */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search farmer, village, or lot no..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-500/20 font-medium text-sm bg-white"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-slate-600"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-5">Farmer</th>
                <th className="p-5">Location</th>
                <th className="p-5">Seed Variety</th>
                <th className="p-5">Sowing Date</th>
                <th className="p-5">Lot No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400">
                    Loading data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-gray-400 italic"
                  >
                    No sowing records found
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.crop_cycle_id}
                    className="hover:bg-green-50/30 transition-colors"
                  >
                    <td className="p-5 font-bold text-gray-800">
                      {row.farmer_name}
                    </td>
                    <td className="p-5 text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {row.village_name}
                    </td>
                    <td className="p-5">
                      <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {row.seed_variety}
                      </span>
                    </td>
                    <td className="p-5 text-gray-600 font-medium">
                      {row.sowing_date}
                    </td>
                    <td className="p-5">
                      {row.lot_no ? (
                        <span className="font-mono font-bold text-black bg-yellow-300 px-2 py-1 rounded border border-yellow-400 shadow-sm">
                          {row.lot_no}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">--</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      <LotNumberModal
        isOpen={isLotModalOpen}
        onClose={() => {
          setIsLotModalOpen(false);
          loadData(); // Refresh list on close to show new Lots
        }}
      />
    </div>
  );
}
