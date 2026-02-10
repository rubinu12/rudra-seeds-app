"use client";

import { useState, useEffect } from "react";
import {
  getShipmentMasterData,
  createShipment,
} from "@/src/app/employee/actions/shipments";
import {
  LoaderCircle,
  Truck,
  Leaf,
  MapPin,
  Search,
  X,
  Check,
  Map as MapIcon, // <--- FIXED: Aliased to avoid conflict
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  onSuccess: () => void;
};

const LOCATION_OPTIONS = [
  "Farm",
  "Parabadi yard",
  "Dhoraji yard",
  "Jalasar yard",
];

export default function NewShipmentModal({
  isOpen,
  onClose,
  location,
  onSuccess,
}: Props) {
  // Master Data
  const [master, setMaster] = useState<{
    seeds: any[];
    transportCos: any[];
    destCos: any[];
    landmarks: any[];
    villages: any[];
  }>({ seeds: [], transportCos: [], destCos: [], landmarks: [], villages: [] });

  // Form State
  const [selectedLocation, setSelectedLocation] = useState(
    location || "Parabadi yard",
  );
  
  // Village State (Stores ID as string)
  const [selectedVillage, setSelectedVillage] = useState<string>(""); 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Landmark Search
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const [showLandmarkList, setShowLandmarkList] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Seed Selection
  const [seedSearch, setSeedSearch] = useState("");
  const [selectedSeedIds, setSelectedSeedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      getShipmentMasterData()
        .then(setMaster)
        .finally(() => setLoadingData(false));

      setSelectedLocation(location || "Parabadi yard");
      setSelectedVillage(""); 
      setSelectedLandmark(null);
      setLandmarkSearch("");
      setSelectedSeedIds([]);
      setSeedSearch("");
    }
  }, [isOpen, location]);

  const toggleSeed = (id: number) => {
    setSelectedSeedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // 1. Validate Seeds
    if (selectedSeedIds.length === 0) {
      toast.error("Please select at least one seed variety.");
      setIsSubmitting(false);
      return;
    }
    formData.append("seedIds", JSON.stringify(selectedSeedIds));

    // 2. Validate & Append Village (If Farm)
    if (selectedLocation === "Farm") {
        if (!selectedVillage) {
            toast.error("Please select a Village.");
            setIsSubmitting(false);
            return;
        }
        // CRITICAL FIX: Manually set the ID to ensure it is sent
        formData.set("villageId", selectedVillage);
    }

    // 3. Append Landmark (Optional)
    if (selectedLocation === "Farm" && selectedLandmark) {
      formData.set("landmarkId", selectedLandmark.id.toString());
    }

    const res = await createShipment(formData);
    if (res.success) {
      toast.success("Truck registered successfully!");
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || "Failed.");
    }
    setIsSubmitting(false);
  };

  // Filters
  const filteredLandmarks = master.landmarks.filter((l) =>
    l.name.toLowerCase().includes(landmarkSearch.toLowerCase()),
  );
  const filteredSeeds = master.seeds.filter((s) =>
    s.variety_name.toLowerCase().includes(seedSearch.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-6 h-6 text-slate-600" />
                New Truck
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Register for loading
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex-1 p-10 flex flex-col items-center justify-center text-slate-400">
            <LoaderCircle className="w-8 h-8 animate-spin mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Loading...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-5 space-y-5"
          >
            {/* 1. Location Section */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
              
              {/* Pickup Point */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-blue-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Pickup Location
                </label>
                <select
                  name="location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* FARM SPECIFIC FIELDS */}
              {selectedLocation === "Farm" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    
                    {/* A. Village (Required) */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-blue-700 flex items-center gap-1.5">
                            <MapIcon className="w-3.5 h-3.5" /> Select Village
                        </label>
                        <select
                            name="villageId" // <--- FIXED: Added name attribute
                            value={selectedVillage}
                            onChange={(e) => setSelectedVillage(e.target.value)}
                            className="w-full p-3 bg-white border border-blue-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Choose Village --</option>
                            {master.villages.map((v: any) => (
                                /* FIX: Use ID as value */
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* B. Landmark (Optional) */}
                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold uppercase text-blue-700 flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5" /> Landmark <span className="text-blue-400 font-normal lowercase">(optional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Landmark..."
                                value={selectedLandmark ? selectedLandmark.name : landmarkSearch}
                                onChange={(e) => {
                                    setLandmarkSearch(e.target.value);
                                    setSelectedLandmark(null);
                                    setShowLandmarkList(true);
                                }}
                                onFocus={() => setShowLandmarkList(true)}
                                className={`w-full p-3 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500 ${selectedLandmark ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-white border-blue-200"}`}
                            />
                            {(selectedLandmark || landmarkSearch) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLandmark(null);
                                        setLandmarkSearch("");
                                    }}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        {/* Landmark Dropdown List */}
                        {showLandmarkList && !selectedLandmark && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                                {filteredLandmarks.length > 0 ? (
                                    filteredLandmarks.map((l) => (
                                        <div
                                            key={l.id}
                                            onClick={() => {
                                                setSelectedLandmark(l);
                                                setShowLandmarkList(false);
                                            }}
                                            className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-50 last:border-0"
                                        >
                                            {l.name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-slate-400 text-center">
                                        No results
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              )}
            </div>

            {/* 2. Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Driver Name
                </label>
                <input
                  name="driverName"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Mobile
                </label>
                <input
                  name="driverMobile"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">
                Vehicle Number
              </label>
              <input
                name="vehicleNo"
                required
                placeholder="GJ-03..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 uppercase placeholder:normal-case"
              />
            </div>

            {/* 3. Companies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Transport
                </label>
                <select
                  name="transportId"
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Select...</option>
                  {master.transportCos.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Destination
                </label>
                <select
                  name="destId"
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Select...</option>
                  {master.destCos.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">
                Capacity (Ton)
              </label>
              <input
                name="capacity"
                type="number"
                step="0.1"
                required
                placeholder="20"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* 4. MOBILE FRIENDLY SEED SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" /> Allowed Varieties
                </span>
                <span className="text-slate-400">
                  {selectedSeedIds.length} Selected
                </span>
              </label>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-60 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search varieties..."
                  value={seedSearch}
                  onChange={(e) => setSeedSearch(e.target.value)}
                  className="w-full mb-2 p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  {filteredSeeds.map((s: any) => {
                    const isSelected = selectedSeedIds.includes(s.seed_id);
                    return (
                      <div
                        key={s.seed_id}
                        onClick={() => toggleSeed(s.seed_id)}
                        className={`p-2 rounded-lg text-sm font-bold border cursor-pointer transition-all flex items-center gap-2
                                            ${isSelected ? "bg-green-100 border-green-300 text-green-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-green-500 border-green-500" : "border-slate-300"}`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="truncate">{s.variety_name}</span>
                      </div>
                    );
                  })}
                  {filteredSeeds.length === 0 && (
                    <p className="col-span-2 text-center text-xs text-slate-400 py-2">
                      No varieties found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={(e) => {
              const form = e.currentTarget
                .closest(".bg-white")
                ?.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={isSubmitting || loadingData}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="w-5 h-5 animate-spin" /> Creating...
              </>
            ) : (
              "Register Truck"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}