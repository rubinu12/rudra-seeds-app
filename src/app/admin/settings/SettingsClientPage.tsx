// app/admin/settings/SettingsClientPage.tsx
"use client";

import React, {
  useState,
  useTransition,
  useActionState,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import * as actions from "./actions";
import type { FormState } from "./actions";
import {
  MasterDataItem,
  SeedVarietySetting,
  ShipmentCompanySetting,
  EmployeeSetting,
  DestinationCompanySetting,
} from "./data";
import {
  Leaf,
  ToggleLeft,
  ToggleRight,
  Tractor,
  Building,
  Globe,
  Plus,
  CheckCircle2,
  LoaderCircle,
  Truck,
  Sprout,
  MapPin,
  Smartphone,
  Laptop,
  Search,
  ArrowRight,
  UserPlus,
  Users,
  Palette,
  ShieldCheck,
  Factory,
  MapPinned,
  Pencil,
  Save,
  LucideIcon,
} from "lucide-react";
import { Input } from "@/src/components/ui/FormInputs";

type SettingsClientPageProps = {
  initialEmployeeMode: "Growing" | "Harvesting";
  initialAdminSeason: "Sowing" | "Growing" | "Harvesting";
  landmarks: MasterDataItem[];
  villages: MasterDataItem[];
  destCompanies: DestinationCompanySetting[];
  seedVarieties: SeedVarietySetting[];
  shipmentCompanies: ShipmentCompanySetting[];
  employees: EmployeeSetting[];
};

const initialState: FormState = { message: "", success: false, error: "" };

export default function SettingsClientPage({
  initialEmployeeMode,
  initialAdminSeason,
  landmarks,
  villages,
  destCompanies,
  seedVarieties,
  shipmentCompanies,
  employees,
}: SettingsClientPageProps) {
  const [employeeMode, setEmployeeMode] = useState(initialEmployeeMode);
  const [adminSeason, setAdminSeason] = useState(initialAdminSeason);
  const [isPending, startTransition] = useTransition();

  const handleEmployeeModeChange = (mode: "Growing" | "Harvesting") => {
    startTransition(async () => {
      const result = await actions.updateEmployeeMode(mode);
      if (result.success) setEmployeeMode(mode);
    });
  };

  const handleAdminSeasonChange = (
    season: "Sowing" | "Growing" | "Harvesting",
  ) => {
    startTransition(async () => {
      const result = await actions.updateAdminDefaultSeason(season);
      if (result.success) setAdminSeason(season);
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-32 space-y-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">
            System Settings
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-lg">
            Manage global configurations, master data lists, and team
            operations.
          </p>
        </div>
        <div className="text-xs font-mono text-on-surface-variant/60 bg-surface-container-high px-3 py-1 rounded-full">
          v2.9.0 • Connected
        </div>
      </div>

      {/* --- 1. MODES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Admin Mode */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Laptop className="w-4 h-4 text-on-surface-variant" />
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Admin Default
            </h2>
          </div>
          <div className="bg-surface rounded-[2rem] p-3 border border-outline/10 shadow-sm flex flex-col gap-2">
            {(["Sowing", "Growing", "Harvesting"] as const).map((season) => (
              <button
                key={season}
                onClick={() => handleAdminSeasonChange(season)}
                disabled={isPending}
                className={`p-4 rounded-2xl text-left transition-all relative group ${adminSeason === season ? "bg-primary-container text-on-primary-container shadow-sm" : "hover:bg-surface-container"}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold flex items-center gap-2">
                    {season === "Sowing" && <Sprout className="w-4 h-4" />}
                    {season === "Growing" && <Leaf className="w-4 h-4" />}
                    {season === "Harvesting" && <Tractor className="w-4 h-4" />}
                    {season} Phase
                  </span>
                  {adminSeason === season && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Employee Mode */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-on-surface-variant" />
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Field App Mode
            </h2>
          </div>
          <div className="bg-surface rounded-[2rem] p-3 border border-outline/10 shadow-sm flex flex-col gap-2 h-full">
            <button
              onClick={() => handleEmployeeModeChange("Growing")}
              disabled={isPending}
              className={`flex-1 p-6 rounded-2xl text-left transition-all border ${employeeMode === "Growing" ? "bg-green-50 border-green-200 shadow-sm" : "bg-surface border-transparent hover:bg-surface-container"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-green-200 text-green-800">
                  <Leaf className="w-5 h-5" />
                </div>
                {employeeMode === "Growing" && (
                  <div className="px-3 py-1 bg-white/60 rounded-full text-[10px] font-bold text-green-800">
                    LIVE
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold">Growing Season</h3>
            </button>
            <button
              onClick={() => handleEmployeeModeChange("Harvesting")}
              disabled={isPending}
              className={`flex-1 p-6 rounded-2xl text-left transition-all border ${employeeMode === "Harvesting" ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-surface border-transparent hover:bg-surface-container"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-amber-200 text-amber-800">
                  <Tractor className="w-5 h-5" />
                </div>
                {employeeMode === "Harvesting" && (
                  <div className="px-3 py-1 bg-white/60 rounded-full text-[10px] font-bold text-amber-800">
                    LIVE
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold">Harvesting Season</h3>
            </button>
          </div>
        </section>
      </div>

      {/* --- 2. TEAM MANAGEMENT --- */}
      <section className="pt-8 border-t border-outline/10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 rounded-full bg-indigo-600"></span>
          <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
            Team & Responsibilities
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Employee Form */}
          <div className="lg:col-span-1 bg-surface rounded-[2rem] p-6 border border-outline/10 shadow-sm h-min">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">
                Add Employee
              </h3>
            </div>
            <EmployeeForm />
          </div>

          {/* Employee List */}
          <div className="lg:col-span-2 space-y-4">
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                allSeeds={seedVarieties}
              />
            ))}
            {employees.length === 0 && (
              <div className="text-center py-12 bg-surface rounded-[2rem] border border-outline/10 text-on-surface-variant">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No employees found.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- 3. MASTER DATA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-outline/10">
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-4 rounded-full bg-blue-500"></span>
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Geography
            </h2>
          </div>
          <MasterDataCard
            title="Villages"
            icon={Globe}
            count={villages.length}
            colorClass="text-blue-600 bg-blue-100"
          >
            <QuickAddForm
              action={actions.addVillage}
              placeholder="Village Name"
              inputName="village_name"
            />
            <DataList items={villages} onToggle={actions.toggleVillage} />
          </MasterDataCard>
          <MasterDataCard
            title="Landmarks"
            icon={MapPin}
            count={landmarks.length}
            colorClass="text-red-600 bg-red-100"
          >
            <QuickAddForm
              action={actions.addLandmark}
              placeholder="Landmark Name"
              inputName="landmark_name"
            />
            <DataList items={landmarks} onToggle={actions.toggleLandmark} />
          </MasterDataCard>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {/* SEED VARIETIES */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-green-600"></span>
              <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Product Catalog
              </h2>
            </div>
            <div className="bg-surface rounded-[2rem] border border-outline/10 shadow-sm overflow-hidden">
              <div className="p-6 bg-surface-container-low/10">
                {/* Add Form */}
                <SeedVarietyForm companies={destCompanies} />
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {/* Seed Items - Now Passing Companies for Editing */}
                {seedVarieties.map((item) => (
                  <SeedVarietyItem
                    key={item.id}
                    item={item}
                    companies={destCompanies}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* LOGISTICS & PARTNERS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-purple-600"></span>
              <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Logistics & Partners
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PARTNER COMPANIES (Address/City support) */}
              <div className="bg-surface rounded-[2rem] border border-outline/10 shadow-sm flex flex-col h-[500px]">
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">
                        Partner Companies
                      </h3>
                      <p className="text-[10px] text-on-surface-variant">
                        Sources & Destinations
                      </p>
                    </div>
                  </div>
                  <PartnerCompanyForm />
                </div>
                <div className="flex-grow overflow-y-auto p-6 pt-0 custom-scrollbar space-y-2">
                  {destCompanies.map((item) => (
                    <DestinationCompanyItem key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* TRANSPORTERS */}
              <div className="bg-surface rounded-[2rem] border border-outline/10 shadow-sm flex flex-col h-[500px]">
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">
                      Transporters
                    </h3>
                  </div>
                  <ShipmentCompanyForm />
                </div>
                <div className="flex-grow overflow-y-auto p-6 pt-0 custom-scrollbar space-y-2">
                  {shipmentCompanies.map((item) => (
                    <ShipmentCompanyItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTS ---

const EmployeeForm = () => {
  const [state, formAction, isPending] = useActionState(
    actions.addEmployee,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Input
        name="name"
        label="Employee Name"
        required
        className="bg-surface-container/30"
      />
      <Input
        name="mobile"
        label="Mobile Number"
        required
        className="bg-surface-container/30"
      />
      <Input
        name="password"
        label="Password"
        type="text"
        required
        className="bg-surface-container/30"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md transition-all active:scale-95"
      >
        {isPending ? (
          <LoaderCircle className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Add to Team
      </button>
      {state?.error && (
        <p className="text-xs text-error text-center">{state.error}</p>
      )}
    </form>
  );
};

const EmployeeCard = ({
  employee,
  allSeeds,
}: {
  employee: EmployeeSetting;
  allSeeds: SeedVarietySetting[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [assignments, setAssignments] = useState<number[]>(
    employee.assigned_seeds,
  );
  const [isSaving, startTransition] = useTransition();

  const handleToggleSeed = (seedId: number) => {
    setAssignments((prev) =>
      prev.includes(seedId)
        ? prev.filter((id) => id !== seedId)
        : [...prev, seedId],
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      await actions.updateEmployeeAssignments(
        employee.id.toString(),
        assignments,
      );
      setIsExpanded(false);
    });
  };

  const assignedVarieties = allSeeds.filter((s) => assignments.includes(s.id));

  return (
    <div className="bg-surface rounded-2xl border border-outline/10 shadow-sm overflow-hidden transition-all">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-low/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${employee.is_active ? "bg-indigo-100 text-indigo-700" : "bg-surface-container text-on-surface-variant"}`}
          >
            {employee.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4
              className={`font-bold ${employee.is_active ? "text-on-surface" : "text-on-surface-variant line-through"}`}
            >
              {employee.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-on-surface-variant">
                {employee.mobile}
              </span>
              {assignedVarieties.length > 0 ? (
                <div className="flex -space-x-1">
                  {assignedVarieties.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: s.color_code }}
                      title={s.name}
                    />
                  ))}
                  {assignedVarieties.length > 3 && (
                    <div className="w-3 h-3 rounded-full bg-surface-container border border-white flex items-center justify-center text-[6px]">
                      +{assignedVarieties.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-error bg-error-container/20 px-1.5 rounded">
                  No Assignments
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => {
              actions.toggleEmployee(employee.id.toString());
            });
          }}
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg"
        >
          {employee.is_active ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 bg-surface-container-low/30 border-t border-outline/10 animate-fadeIn">
          <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
            Assign Responsibilities
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {allSeeds.map((seed) => (
              <button
                key={seed.id}
                onClick={() => handleToggleSeed(seed.id)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${assignments.includes(seed.id) ? "bg-white border-primary/30 shadow-sm" : "bg-transparent border-transparent hover:bg-white/50 opacity-60"}`}
              >
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: seed.color_code }}
                ></div>
                <span className="truncate">{seed.name}</span>
                {assignments.includes(seed.id) && (
                  <CheckCircle2 className="w-3 h-3 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Save Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Partner Company Form (Preserved Address/City Fields + JSON support)
const PartnerCompanyForm = () => {
  const [state, formAction, isPending] = useActionState(
    actions.addDestinationCompany,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input
        name="company_name"
        placeholder="Company Name *"
        required
        className="w-full h-11 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="gst_no"
          placeholder="GST Number"
          className="w-full h-10 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 outline-none text-xs transition-all uppercase"
        />
        <input
          name="mobile"
          placeholder="Mobile Number"
          className="w-full h-10 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 outline-none text-xs transition-all"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="relative col-span-2">
          <input
            name="address"
            placeholder="Bill To Address"
            className="w-full h-10 pl-9 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 outline-none text-xs transition-all"
          />
          <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
        </div>
        <div className="col-span-1">
          <input
            name="city"
            placeholder="City"
            className="w-full h-10 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 outline-none text-xs transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-10 mt-1 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-all active:scale-95"
      >
        {isPending ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Add Partner <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {state?.error && (
        <p className="text-xs text-error text-center">{state.error}</p>
      )}
    </form>
  );
};

// Seed Form with Company Dropdown & Error Handling
const SeedVarietyForm = ({ companies }: { companies: MasterDataItem[] }) => {
  const [state, formAction, isPending] = useActionState(
    actions.addSeedVariety,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  const activeCompanies = companies.filter((c) => c.is_active);

  return (
    <form ref={formRef} action={formAction}>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-grow w-full">
          <input
            name="variety_name"
            placeholder="Variety Name"
            required
            className="h-11 px-4 bg-surface rounded-lg border border-outline/20 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
          />
          <input
            name="crop_type"
            placeholder="Crop Type"
            required
            className="h-11 px-4 bg-surface rounded-lg border border-outline/20 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
          />

          {/* DROPDOWN FOR COMPANY */}
          <div className="relative h-11">
            <select
              name="dest_company_id"
              required
              defaultValue=""
              className="w-full h-full pl-4 pr-10 bg-surface rounded-lg border border-outline/20 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select Company
              </option>
              {activeCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              <Factory className="w-4 h-4 opacity-50" />
            </div>
          </div>

          <div className="relative h-11">
            <input
              type="color"
              name="color_code"
              defaultValue="#2563eb"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div className="h-full w-full bg-surface rounded-lg border border-outline/20 flex items-center px-4 gap-2 text-sm text-on-surface-variant">
              <Palette className="w-4 h-4" /> Pick Color
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-11 px-6 bg-primary text-on-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 text-sm font-bold shadow-sm transition-transform active:scale-95 whitespace-nowrap w-full md:w-auto justify-center"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </button>
      </div>
      {/* Display Server Error if Failed (e.g. Table missing) */}
      {state?.error && (
        <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs font-bold rounded text-center border border-red-100">
          {state.error}
        </div>
      )}
    </form>
  );
};

// UPDATED COMPONENT: SeedVarietyItem with EDITING capabilities
const SeedVarietyItem = ({
  item,
  companies,
}: {
  item: SeedVarietySetting;
  companies: MasterDataItem[];
}) => {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  // State for local editing before save
  const [editData, setEditData] = useState({
    variety_name: item.name,
    crop_type: item.crop_type,
    dest_company_id: item.company_id || "",
    color_code: item.color_code,
  });

  const handleColorChange = () => {
    if (isEditing) return; // Disable quick color change in edit mode
    const newColor = prompt(
      "Enter new hex color (e.g. #ff0000):",
      item.color_code,
    );
    if (newColor)
      startTransition(async () => {
        await actions.updateSeedColor(item.id, newColor);
      });
  };

  const handleSaveEdit = () => {
    startTransition(async () => {
      const result = await actions.updateSeedVarietyDetails(item.id, editData);
      if (result.success) {
        setIsEditing(false);
      } else {
        alert(`Error: ${result.error || "Failed to update"}`);
      }
    });
  };

  const activeCompanies = companies.filter((c) => c.is_active);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 relative group ${item.is_active ? "bg-surface border-outline/10 hover:border-primary/20 hover:shadow-md" : "bg-surface-container/30 border-transparent opacity-60"}`}
    >
      {isEditing ? (
        // --- EDIT MODE ---
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full shadow-sm relative overflow-hidden">
              <input
                type="color"
                value={editData.color_code}
                onChange={(e) =>
                  setEditData({ ...editData, color_code: e.target.value })
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: editData.color_code }}
              />
            </div>
            <input
              value={editData.variety_name}
              onChange={(e) =>
                setEditData({ ...editData, variety_name: e.target.value })
              }
              className="flex-grow h-8 px-2 bg-white rounded border border-primary/30 text-sm focus:outline-none focus:ring-2 ring-primary/20"
              placeholder="Variety Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={editData.crop_type}
              onChange={(e) =>
                setEditData({ ...editData, crop_type: e.target.value })
              }
              className="h-8 px-2 bg-white rounded border border-primary/30 text-xs focus:outline-none focus:ring-2 ring-primary/20"
              placeholder="Crop Type"
            />
            <select
              value={editData.dest_company_id}
              onChange={(e) =>
                setEditData({ ...editData, dest_company_id: e.target.value })
              }
              className="h-8 px-2 bg-white rounded border border-primary/30 text-xs focus:outline-none focus:ring-2 ring-primary/20"
            >
              <option value="" disabled>
                Select Company
              </option>
              {activeCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              disabled={isPending}
              className="flex-1 h-8 bg-green-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700"
            >
              {isPending ? (
                <LoaderCircle className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}{" "}
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="flex-1 h-8 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // --- VIEW MODE ---
        <>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-10 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: item.color_code }}
                onClick={handleColorChange}
                title="Click to change color"
              ></div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">
                  {item.name}
                </h4>
                <p className="text-[11px] font-bold text-primary tracking-wide uppercase mt-0.5">
                  {item.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-on-surface-variant hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit details"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {/* Toggle Button */}
              <button
                onClick={() =>
                  startTransition(() => {
                    actions.toggleSeedVariety(item.id);
                  })
                }
                disabled={isPending}
                className="p-1 text-on-surface-variant hover:text-primary"
              >
                {item.is_active ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between pl-6">
            <span className="text-[10px] bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant font-medium">
              {item.crop_type}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// --- SUB-COMPONENT PROPS (Typed) ---

type MasterDataCardProps = {
    title: string;
    icon: LucideIcon;
    count: number;
    children: ReactNode;
    colorClass: string;
    className?: string;
};

function MasterDataCard({
  title,
  icon: Icon,
  count,
  children,
  colorClass,
  className = "",
}: MasterDataCardProps) {
  return (
    <div
      className={`bg-surface rounded-[2rem] border border-outline/10 shadow-sm flex flex-col overflow-hidden ${className}`}
    >
      <div className="p-6 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">{title}</h3>
        </div>
        <span className="text-xs font-bold bg-surface-container px-2.5 py-1 rounded-md text-on-surface-variant">
          {count}
        </span>
      </div>
      <div className="flex-grow flex flex-col px-6 pb-6 gap-6">{children}</div>
    </div>
  );
}

type QuickAddFormProps = {
    action: (prevState: FormState, formData: FormData) => Promise<FormState>;
    placeholder: string;
    inputName: string;
};

function QuickAddForm({ action, placeholder, inputName }: QuickAddFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);
  return (
    <form action={formAction} ref={formRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <input
            name={inputName}
            placeholder={placeholder}
            className="w-full h-12 pl-4 pr-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-12 w-12 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-transform active:scale-95 shadow-sm"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>
      {state?.error && (
        <p className="absolute -bottom-5 left-1 text-[10px] text-error font-medium">
          {state.error}
        </p>
      )}
    </form>
  );
}

type DataListProps = {
    items: MasterDataItem[];
    onToggle: (id: number) => void;
};

function DataList({ items, onToggle }: DataListProps) {
  return (
    <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2 max-h-[300px]">
      {items.map((item) => (
        <DataItem
          key={item.id}
          item={item}
          onToggle={() => onToggle(item.id)}
        />
      ))}
      {items.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/40 py-8">
          <Search className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No records found</p>
        </div>
      )}
    </div>
  );
}

const DataItem = ({
  item,
  onToggle,
}: {
  item: MasterDataItem;
  onToggle: () => void;
}) => {
  const [isPending, startTransition] = useTransition();
  return (
    <div
      className={`group flex items-center justify-between p-3 px-4 rounded-xl border transition-all duration-200 ${item.is_active ? "bg-surface border-outline/10 hover:border-outline/30 shadow-sm" : "bg-surface-container/30 border-transparent opacity-60 grayscale"}`}
    >
      <span
        className={`text-sm font-medium ${item.is_active ? "text-on-surface" : "text-on-surface-variant line-through"}`}
      >
        {item.name}
      </span>
      <button
        onClick={() =>
          startTransition(() => {
            onToggle();
          })
        }
        disabled={isPending}
        className={`p-1.5 rounded-lg transition-colors ${item.is_active ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-on-surface-variant hover:bg-black/5"}`}
      >
        {isPending ? (
          <LoaderCircle className="w-5 h-5 animate-spin" />
        ) : item.is_active ? (
          <ToggleRight className="w-5 h-5" />
        ) : (
          <ToggleLeft className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

const ShipmentCompanyForm = () => {
  const [state, formAction, isPending] = useActionState(
    actions.addShipmentCompany,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input
        name="company_name"
        placeholder="Company Name *"
        required
        className="w-full h-11 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="owner_name"
          placeholder="Owner Name"
          className="h-10 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 outline-none text-xs transition-all"
        />
        <input
          name="owner_mobile"
          placeholder="Mobile No"
          className="h-10 px-4 bg-surface-container/50 rounded-xl border border-transparent focus:bg-surface focus:border-primary/20 outline-none text-xs transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-10 mt-1 bg-primary text-on-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-all active:scale-95"
      >
        {isPending ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Add Transporter <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {state?.error && (
        <p className="text-xs text-error text-center">{state.error}</p>
      )}
    </form>
  );
};

const ShipmentCompanyItem = ({ item }: { item: ShipmentCompanySetting }) => {
  const [isPending, startTransition] = useTransition();
  return (
    <div
      className={`p-3 rounded-xl border flex justify-between items-center transition-all ${item.is_active ? "bg-surface border-outline/10 hover:border-outline/30" : "bg-surface-container/30 border-transparent opacity-60"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${item.is_active ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"}`}
        >
          {item.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p
            className={`text-sm font-bold ${item.is_active ? "text-on-surface" : "text-on-surface-variant line-through"}`}
          >
            {item.name}
          </p>
          {(item.owner_name || item.owner_mobile) && (
            <p className="text-[10px] text-on-surface-variant">
              {item.owner_name}{" "}
              {item.owner_mobile ? `• ${item.owner_mobile}` : ""}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() =>
          startTransition(() => {
            actions.toggleShipmentCompany(item.id.toString());
          })
        }
        disabled={isPending}
        className={`p-1.5 rounded-lg transition-colors ${item.is_active ? "text-primary hover:bg-primary/5" : "text-on-surface-variant hover:bg-black/5"}`}
      >
        {item.is_active ? (
          <ToggleRight className="w-5 h-5" />
        ) : (
          <ToggleLeft className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

const DestinationCompanyItem = ({ item }: { item: DestinationCompanySetting }) => {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  
  const [editData, setEditData] = useState({
    address: item.address || "",
    city: item.city || "",
    gst_no: item.gst_no || "",
    mobile: item.mobile || "",
    ship_to_addresses: [...item.ship_to_addresses],
  });

  const [newShipAddress, setNewShipAddress] = useState("");

  const handleSaveEdit = () => {
    startTransition(async () => {
      const result = await actions.updateDestinationCompanyDetails(item.id, editData);
      if (result.success) {
        setIsEditing(false);
      } else {
        alert(`Error: ${result.error || "Failed to update"}`);
      }
    });
  };

  const addShipAddress = () => {
    if (newShipAddress.trim()) {
      setEditData({
        ...editData,
        ship_to_addresses: [...editData.ship_to_addresses, newShipAddress.trim()]
      });
      setNewShipAddress("");
    }
  };

  const removeShipAddress = (index: number) => {
    const updated = [...editData.ship_to_addresses];
    updated.splice(index, 1);
    setEditData({ ...editData, ship_to_addresses: updated });
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 relative group ${item.is_active ? "bg-surface border-outline/10 hover:border-orange-500/20 hover:shadow-md" : "bg-surface-container/30 border-transparent opacity-60"}`}>
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-on-surface text-sm">{item.name}</h4>
          {!isEditing && (
            <div className="flex flex-col mt-1 gap-0.5">
               {item.gst_no && <span className="text-[10px] font-mono text-on-surface-variant">GST: {item.gst_no}</span>}
               {item.address && <span className="text-[10px] text-on-surface-variant max-w-[200px] truncate">{item.address}, {item.city}</span>}
               {item.ship_to_addresses.length > 0 && (
                   <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded w-max mt-1">
                       {item.ship_to_addresses.length} Ship-To Address(es)
                   </span>
               )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 text-on-surface-variant hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => startTransition(() => { actions.toggleDestinationCompany(item.id); })}
            disabled={isPending}
            className="p-1 text-on-surface-variant hover:text-primary"
          >
            {item.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-3 mt-3 pt-3 border-t border-outline/10">
          <div className="grid grid-cols-2 gap-2">
            <input value={editData.gst_no} onChange={(e) => setEditData({ ...editData, gst_no: e.target.value })} className="h-8 px-2 bg-white rounded border border-orange-500/30 text-xs focus:outline-none focus:ring-2 ring-orange-500/20 uppercase" placeholder="GST Number" />
            <input value={editData.mobile} onChange={(e) => setEditData({ ...editData, mobile: e.target.value })} className="h-8 px-2 bg-white rounded border border-orange-500/30 text-xs focus:outline-none focus:ring-2 ring-orange-500/20" placeholder="Mobile" />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className="col-span-2 h-8 px-2 bg-white rounded border border-orange-500/30 text-xs focus:outline-none focus:ring-2 ring-orange-500/20" placeholder="Bill To Address" />
            <input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="col-span-1 h-8 px-2 bg-white rounded border border-orange-500/30 text-xs focus:outline-none focus:ring-2 ring-orange-500/20" placeholder="City" />
          </div>

          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 space-y-2">
            <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Ship-To Addresses (Consignee)</span>
            {editData.ship_to_addresses.map((addr, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-1.5 rounded text-[11px] border border-orange-200">
                    <span className="truncate flex-1">{addr}</span>
                    <button onClick={() => removeShipAddress(idx)} className="text-red-500 hover:text-red-700 ml-2 px-1 text-lg leading-none">&times;</button>
                </div>
            ))}
            <div className="flex gap-1">
                <input value={newShipAddress} onChange={(e) => setNewShipAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addShipAddress())} className="flex-1 h-7 px-2 bg-white rounded border border-orange-500/30 text-[11px] focus:outline-none" placeholder="Add new delivery address..." />
                <button type="button" onClick={addShipAddress} className="h-7 px-2 bg-orange-600 text-white rounded text-[11px] font-bold hover:bg-orange-700">Add</button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveEdit} disabled={isPending} className="flex-1 h-8 bg-green-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700">
              {isPending ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
            <button onClick={() => setIsEditing(false)} disabled={isPending} className="flex-1 h-8 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};