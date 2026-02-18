"use client";

import React from "react";
import { Input } from "@/src/components/ui/FormInputs";
import SearchableSelect from "@/src/components/ui/SearchableSelect";
import { CheckCircle2, Circle, Sprout } from "lucide-react";

// Updated Type Definition including lot_no
export type CycleData = {
  landmarkId: string;
  seedId: string;
  bags: number;
  date: string;
  goods_collection_method: string;
  paymentChoice: string;
  amountPaid: number;
  lot_no: string; 
};

type Option = { value: string; label: string };

type Props = {
  cycleState: [CycleData, React.Dispatch<React.SetStateAction<CycleData>>];
  landmarkOptions: Option[];
  seedVarietyOptions: Option[];
};

export const SowingSection = ({
  cycleState,
  landmarkOptions,
  seedVarietyOptions,
}: Props) => {
  const [cycleData, setCycleData] = cycleState;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Explicit type for prev to avoid errors
    setCycleData((prev: CycleData) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setCycleData((prev: CycleData) => ({ ...prev, [name]: value }));
  };

  const collectionOptions = [
    { value: "Farm", label: "Farm" },
    { value: "Parabadi yard", label: "Parabadi yard" },
    { value: "Dhoraji yard", label: "Dhoraji yard" },
    { value: "Jalansar yard", label: "Jalansar yard" },
  ];

  const StyledRadio = ({ value, label }: { value: string; label: string }) => {
    const isSelected = cycleData.goods_collection_method === value;
    return (
      <label
        className={`
                relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "border-outline/20 hover:bg-surface-container-high"
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

        {/* --- NEW LOT NUMBER FIELD --- */}
        <div className="relative">
             <Input
                type="text"
                id="lot_no"
                name="lot_no"
                label="Lot Numbers (Optional)"
                value={cycleData.lot_no}
                onChange={handleValueChange}
                className="uppercase placeholder:normal-case font-mono"
                placeholder="e.g. L-101, L-102"
              />
              <p className="text-[11px] text-on-surface-variant/70 mt-1.5 ml-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                  Separate multiple lots with commas
              </p>
        </div>
        
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
            step="0.01"
            value={cycleData.bags}
            onChange={handleValueChange}
            required
            onWheel={(e) => (e.target as HTMLElement).blur()}
          />
        </div>

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