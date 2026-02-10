// components/admin/cycles/new/SowingSection.tsx
"use client";
import React from "react";
import { Input } from "@/src/components/ui/FormInputs";
import SearchableSelect from "@/src/components/ui/SearchableSelect";
import { CheckCircle2, Circle, Sprout } from "lucide-react";

type Option = { value: string; label: string };

type Props = {
  cycleState: [any, Function];
  landmarkOptions: Option[];
  seedVarietyOptions: Option[];
};

export const SowingSection = ({
  cycleState,
  landmarkOptions,
  seedVarietyOptions,
}: Props) => {
  const [cycleData, setCycleData] = cycleState;

  const handleValueChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type } = e.target;
    setCycleData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setCycleData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Exact text options as requested
  const collectionOptions = [
    { value: "Farm", label: "Farm" },
    { value: "Parabadi yard", label: "Parabadi yard" },
    { value: "Dhoraji yard", label: "Dhoraji yard" },
    { value: "Jalansar yard", label: "Jalansar yard" },
  ];

  // --- Custom Radio Item ---
  const StyledRadio = ({ value, label }: { value: string; label: string }) => {
    const isSelected = cycleData.goods_collection_method === value;
    return (
      <label
        className={`
                relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? "bg-primary/10 border-primary" // Selected: Background + Border
                    : "border-outline/20 hover:bg-surface-container-high" // Unselected
                }
            `}
      >
        <input
          type="radio"
          name="goods_collection_method"
          value={value}
          checked={isSelected}
          onChange={handleValueChange}
          className="sr-only"
        />

        {/* Tick Icon if selected, Empty Circle if not */}
        <div className="mr-3">
          {isSelected ? (
            <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
          ) : (
            <Circle className="w-5 h-5 text-on-surface-variant/40" />
          )}
        </div>

        <span
          className={`font-medium ${isSelected ? "text-primary" : "text-on-surface"}`}
        >
          {label}
        </span>
      </label>
    );
  };

  return (
    <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 grid place-items-center rounded-2xl bg-tertiary-container">
          <Sprout className="w-6 h-6 text-on-tertiary-container" />
        </div>
        <h2 className="text-[1.75rem] font-normal text-on-surface">
          Sowing Details
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        <SearchableSelect
          id="landmarkId"
          name="landmarkId"
          label="Landmark"
          options={landmarkOptions}
          value={cycleData.landmarkId}
          onChange={handleSelectChange("landmarkId")}
        />
        <SearchableSelect
          id="seedId"
          name="seedId"
          label="Seed Variety"
          options={seedVarietyOptions}
          value={cycleData.seedId}
          onChange={handleSelectChange("seedId")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            id="date"
            name="date"
            label="Sowing Date"
            value={cycleData.date}
            onChange={handleValueChange}
            required
          />
          <Input
            type="number"
            id="bags"
            name="bags"
            label="Seed Bags"
            value={cycleData.bags}
            onChange={handleValueChange}
            required
            onWheel={(e) => (e.target as HTMLElement).blur()}
          />
        </div>

        {/* --- Goods Collection Method (Vertical List) --- */}
        <div>
          <p className="text-sm font-medium text-on-surface-variant mb-3 px-1">
            Goods Collection Method
          </p>
          <div className="flex flex-col gap-3">
            {collectionOptions.map((opt) => (
              <StyledRadio
                key={opt.value}
                value={opt.value}
                label={opt.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
