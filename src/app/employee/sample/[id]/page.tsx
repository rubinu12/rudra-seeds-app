"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  UserCircle,
  Sprout,
  Hash,
  Phone,
  MapPin,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  getSampleDetails,
  submitLabData,
} from "@/src/app/employee/actions/lab";

type Params = Promise<{ id: string }>;

// --- TYPES ---
type DropdownOption = { value: string; label: string };

// [UPDATED] Type definition matches the DB columns and new Action response
type CycleData = {
    farmer_name: string;
    lot_number: string | null; // Updated from lot_no
    mobile_number: string | null;
    village_name: string;
    goods_collection_method: string | null;
    color_grade: string | null;
    sample_non_seed: string | null;
    sample_moisture: number | null;
    sample_purity: number | null;
    dust_percentage: number | null;
    sample_remarks: string | null; // Updated from lab_remarks
    temporary_price_per_man: number | null; // Updated from price_per_20kg
};

type DropdownProps = {
    label: string;
    name: string;
    value: string;
    options: DropdownOption[];
    onChange: (val: string) => void;
};

// --- CONFIGURATION ---
const LOCATION_OPTIONS = [
  { value: "Farm", label: "Farm (ખેડૂત)" },
  { value: "Parabadi yard", label: "Parabadi Yard" },
  { value: "Dhoraji yard", label: "Dhoraji Yard" },
  { value: "Jalasar yard", label: "Jalasar Yard" },
];

const COLOR_OPTIONS = [
  { value: "White", label: "White (સફેદ)" },
  { value: "Good", label: "Good (સારું)" },
  { value: "Excellent", label: "Excellent (શ્રેષ્ઠ)" },
];

const NON_SEED_OPTIONS = [
  { value: "High", label: "High (વધારે)" },
  { value: "Less", label: "Less (ઓછું)" },
  { value: "Rare", label: "Rare (ભાગ્યે જ)" },
];

// --- DROPDOWN COMPONENT ---
function CustomDropdown({ label, name, value, options, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-slate-500 mb-1.5 block">
        {label}
      </label>

      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border flex items-center justify-between text-left text-sm font-bold rounded-2xl px-4 py-4 shadow-sm transition-all duration-200 ${
          isOpen
            ? "border-purple-500 ring-2 ring-purple-100"
            : "border-slate-200 text-slate-900"
        }`}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-purple-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 text-sm font-bold flex items-center justify-between transition-colors ${
                value === opt.value
                  ? "bg-purple-50 text-purple-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.label}
              {value === opt.value && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE ---
export default function SampleEntryPage({ params }: { params: Params }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formState, setFormState] = useState({
    location: "Farm",
    color: "",
    nonSeed: "Rare",
  });

  useEffect(() => {
    // Fetch Data
    getSampleDetails(Number(id)).then((res) => {
      if (res) {
        setData(res as unknown as CycleData); 
        setFormState({
          location: res.goods_collection_method || "Farm",
          color: res.color_grade || "",
          nonSeed: res.sample_non_seed || "Rare",
        });
      } else {
        setError("Database Error: Check Server Logs.");
      }
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await submitLabData(Number(id), formData);

    if (res.success) {
      router.push("/employee/dashboard");
    } else {
      alert("Error saving: " + res.message);
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );

  if (error || !data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-5 text-center">
        <p className="text-red-500 font-bold mb-4">{error || "Data not found"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-200 rounded-lg font-bold"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-10 font-sans">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-slate-600 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              {data.farmer_name}
            </h1>
            <span className="text-xs font-bold text-slate-400">ID: {id}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-[#FFF5F7] rounded-[24px] p-5 shadow-sm border border-red-50 relative overflow-hidden">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 relative z-10">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                Lot No (Multi)
              </label>
              <div className="text-sm font-black text-slate-800 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />{" "}
                {/* [UPDATED] Uses lot_number which contains comma-separated lots */}
                {data.lot_number || "N/A"}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                Mobile
              </label>
              <div className="text-sm font-black text-slate-800 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />{" "}
                {data.mobile_number}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                Village
              </label>
              <div className="text-sm font-black text-slate-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />{" "}
                {data.village_name}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                Location
              </label>
              <div className="text-xs font-bold text-purple-700">
                {formState.location || "Farm"}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-10px_rgba(147,51,234,0.15)] border border-purple-100">
            <h2 className="text-sm font-black text-purple-900 mb-5 flex items-center gap-2 border-b border-purple-50 pb-3">
              <Sprout className="w-4 h-4" /> નમૂનાની વિગતો (Sample Details)
            </h2>

            <div className="space-y-4">
              <CustomDropdown
                label="માલ ક્યાં છે? (Collection Location)"
                name="goods_collection_method"
                value={formState.location}
                options={LOCATION_OPTIONS}
                onChange={(val: string) =>
                  setFormState((prev) => ({ ...prev, location: val }))
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    ભેજ (%)
                  </label>
                  <input
                    name="sample_moisture"
                    type="number"
                    step="0.01"
                    defaultValue={data.sample_moisture || ""}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm placeholder:text-slate-300 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    શુદ્ધતા (%)
                  </label>
                  <input
                    name="sample_purity"
                    type="number"
                    step="0.01"
                    defaultValue={data.sample_purity || ""}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm placeholder:text-slate-300 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    કચરો (Dust %)
                  </label>
                  <input
                    name="dust_percentage"
                    type="number"
                    step="0.01"
                    defaultValue={data.dust_percentage || ""}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm placeholder:text-slate-300 transition-all"
                  />
                </div>

                <div>
                  <CustomDropdown
                    label="કલર ગ્રેડ"
                    name="color_grade"
                    value={formState.color}
                    options={COLOR_OPTIONS}
                    onChange={(val: string) =>
                      setFormState((prev) => ({ ...prev, color: val }))
                    }
                  />
                </div>
              </div>

              <CustomDropdown
                label="બિન-બીજ (Non-Seed)"
                name="sample_non_seed"
                value={formState.nonSeed}
                options={NON_SEED_OPTIONS}
                onChange={(val: string) =>
                  setFormState((prev) => ({ ...prev, nonSeed: val }))
                }
              />

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                  રિમાર્ક (વૈકલ્પિક)
                </label>
                <textarea
                  name="remarks"
                  defaultValue={data.sample_remarks || ""}
                  placeholder="Any other notes..."
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-24 shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 opacity-70 grayscale">
            <h2 className="text-sm font-black text-slate-400 mb-3 flex items-center gap-2">
              <UserCircle className="w-4 h-4" /> કાચો ભાવ (Admin Only)
            </h2>

            <input
              type="text"
              value={
                data.temporary_price_per_man ? `₹ ${data.temporary_price_per_man}` : "Pending"
              }
              disabled
              className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-lg font-bold rounded-2xl px-4 py-3 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-purple-200 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4 hover:bg-[#6D28D9]"
          >
            {submitting ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Data
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}