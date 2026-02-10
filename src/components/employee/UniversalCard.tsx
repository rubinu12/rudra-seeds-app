"use client";

import {
  Phone,
  ArrowRight,
  Scale,
  Beaker,
  Truck,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  LoaderCircle, // <--- Added Import
} from "lucide-react";
import { MODERN_THEMES } from "@/src/app/employee/theme";
import { GUJARATI } from "@/src/app/employee/translations";
import { useState, useEffect } from "react";

export default function UniversalCard({ data, location, onAction }: any) {
  const theme = MODERN_THEMES[location] || MODERN_THEMES["Farm"];
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with the global location passed from props
  const [selectedLocation, setSelectedLocation] = useState(location || "Farm");

  // Update internal state if the global location changes
  useEffect(() => {
    if (location) setSelectedLocation(location);
  }, [location]);

  const seedColor = data.color_code || "#64748b";
  const cardStyle = {
    borderLeft: `5px solid ${seedColor}`,
    background: `linear-gradient(to right, ${seedColor}08, #ffffff 40%)`,
  };

  const handleAction = async () => {
    if (isLoading) return;
    setIsLoading(true);
    // await allows the UI to stay in "Loading" state until navigation/action completes
    await onAction(selectedLocation); 
    setIsLoading(false);
  };

  const renderAction = () => {
    if (data.is_farmer_paid || data.status === "Shipped") {
      return (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-800 font-bold">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          {GUJARATI.msg_cheque_ready}
        </div>
      );
    }

    switch (data.status) {
      case "Growing":
        return (
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex-grow">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                Collection Point
              </label>
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2 pl-3 pr-8 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                >
                  <option value="Farm">{GUJARATI.loc_farm}</option>
                  <option value="Parabadi yard">{GUJARATI.loc_parabadi}</option>
                  <option value="Dhoraji yard">{GUJARATI.loc_dhoraji}</option>
                  <option value="Jalasar yard">{GUJARATI.loc_jalasar}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div
              onClick={handleAction}
              className={`flex flex-col items-end cursor-pointer group ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
            >
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 group-hover:text-slate-600 transition-colors">
                {isLoading ? "Saving..." : `${GUJARATI.btn_mark_harvested}?`}
              </label>
              <div
                className={`w-12 h-7 rounded-full transition-all duration-300 ease-in-out flex items-center px-1 shadow-inner ${
                  isLoading
                    ? "bg-green-200"
                    : "bg-slate-200 group-hover:bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    isLoading ? "translate-x-5" : "translate-x-0"
                  }`}
                >
                  {isLoading && <LoaderCircle className="w-3 h-3 text-green-600 animate-spin m-1" />}
                </div>
              </div>
            </div>
          </div>
        );

      case "Harvested":
        return (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`w-full py-3 mt-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 ${theme.btn} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isLoading ? "Processing..." : GUJARATI.btn_mark_collected}
          </button>
        );

      case "Sample Collected":
        return (
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-700 bg-green-50 py-2 rounded-lg border border-green-100">
              <CheckCircle2 className="w-3 h-3" /> {GUJARATI.status_collected}
            </div>
            <button
              onClick={handleAction}
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 border border-purple-500 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              {isLoading ? "Opening Form..." : GUJARATI.btn_enter_lab_data}
            </button>
          </div>
        );

      case "Priced":
        return (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`w-full py-3 mt-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 ${theme.btn} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            {isLoading ? "Opening Scale..." : GUJARATI.btn_start_weighing}
          </button>
        );

      case "Weighed":
        return (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`w-full py-3 mt-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 ${theme.btn} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            {isLoading ? "Loading..." : GUJARATI.btn_add_to_shipment}
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden mb-3 animate-in fade-in zoom-in-95 duration-300"
      style={cardStyle}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-lg font-bold text-slate-900 leading-tight">
          {data.farmer_name}
        </h3>
        {data.mobile_number && (
          <a
            href={`tel:${data.mobile_number}`}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-green-600 active:bg-slate-50 transition-colors ml-2"
            onClick={(e) => e.stopPropagation()} 
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center text-xs font-medium text-slate-600 gap-y-1">
        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
        <span className="font-bold text-slate-800">
          {data.village_name || "Unknown"}
        </span>
        {data.landmark_name && (
          <>
            <ArrowRight className="w-3 h-3 mx-1.5 text-slate-300" />
            <span className="text-slate-500 truncate">
              {data.landmark_name}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <span
          className="px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wide shadow-sm"
          style={{
            backgroundColor: `${seedColor}15`,
            color: seedColor,
            borderColor: `${seedColor}30`,
          }}
        >
          {data.seed_variety}
        </span>
        {data.bags > 0 && (
          <span
            className={`px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${theme.pill}`}
          >
            {data.bags} {GUJARATI.bags}
          </span>
        )}
        {data.lot_no && (
          <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide">
            {GUJARATI.lot_no}: {data.lot_no}
          </span>
        )}
      </div>

      <div>{renderAction()}</div>
    </div>
  );
}