// components/admin/cycles/new/FarmSowingForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { FarmerDetails, Landmark, SeedVariety } from '@/lib/definitions';
import { Tractor, PlusCircle, ChevronDown } from 'lucide-react';

// --- Local, perfectly typed sub-components for this form ---
function Input(props: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
    const { id, label, className, ...rest } = props;
    return (
      <div className={`relative bg-input-bg/80 border border-outline rounded-lg h-14 focus-within:border-primary focus-within:border-2 ${className}`}>
        <input id={id} className="w-full h-full pt-5 px-4 bg-transparent outline-none text-on-surface peer" placeholder=" " {...rest} />
        <label htmlFor={id} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-primary peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:text-xs">
          {label}
        </label>
      </div>
    );
}
  
function Select(props: React.ComponentPropsWithoutRef<'select'> & { label: string }) {
      const { id, label, children, className, ...rest } = props;
      return (
          <div className={`relative bg-input-bg/80 border border-outline rounded-lg h-14 focus-within:border-primary focus-within:border-2 ${className}`}>
              <select id={id} className="w-full h-full pt-5 px-4 bg-transparent outline-none text-on-surface peer appearance-none" {...rest}>
                  {children}
              </select>
              <label htmlFor={id} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-primary peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:text-xs">
                  {label}
              </label>
              <div className="absolute top-0 right-0 h-full flex items-center px-4 pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-on-surface-variant" />
              </div>
          </div>
      );
}

// --- Main Component ---
type Props = { farmer: FarmerDetails | null; landmarks: Landmark[]; seedVarieties: SeedVariety[]; onSeedBagsChange: (b: number) => void; };

export default function FarmSowingForm({ farmer, landmarks, seedVarieties, onSeedBagsChange }: Props) {
  return (
    <div className="bg-surface-container rounded-m3-xlarge p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 grid place-items-center rounded-2xl bg-tertiary-container">
          <Tractor className="w-6 h-6 text-on-tertiary-container" />
        </div>
        <h2 className="text-3xl font-normal text-on-surface">Sowing Details</h2>
      </div>

      <div className="flex flex-col gap-6">
        <Select id="landmark_id" name="landmark_id" label="Landmark" required>
          <option value="">Select a landmark...</option>
          {landmarks.map(l => (<option key={l.landmark_id} value={l.landmark_id}>{l.landmark_name}</option>))}
        </Select>
        <Select id="seed_id" name="seed_id" label="Seed Variety" required>
          <option value="">Select a variety...</option>
          {seedVarieties.map(s => (<option key={s.seed_id} value={s.seed_id}>{s.variety_name}</option>))}
        </Select>
        <Input type="number" id="seed_bags_purchased" name="seed_bags_purchased" label="Seed Bags" onChange={(e) => onSeedBagsChange(Number(e.target.value))} required />
        <Input type="date" id="sowing_date" name="sowing_date" label="Sowing Date" defaultValue={new Date().toISOString().split('T')[0]} required />
        <div>
          <p className="text-sm text-on-surface-variant mb-2">Goods Collection Method</p>
          <div className="flex gap-6">
            <label htmlFor="pickup" className="flex items-center cursor-pointer">
              <input id="pickup" name="goods_collection_method" type="radio" value="RudraSeeds Pickup" className="peer sr-only" defaultChecked />
              <span className="w-5 h-5 border-2 border-outline rounded-full grid place-items-center peer-checked:border-primary"><span className="w-2.5 h-2.5 rounded-full bg-primary transform scale-0 peer-checked:scale-100 transition-transform"></span></span>
              <span className="ml-2 text-on-surface">RudraSeeds Pickup</span>
            </label>
            <label htmlFor="dropoff" className="flex items-center cursor-pointer">
              <input id="dropoff" name="goods_collection_method" type="radio" value="Farmer Drop-off" className="peer sr-only" />
              <span className="w-5 h-5 border-2 border-outline rounded-full grid place-items-center peer-checked:border-primary"><span className="w-2.5 h-2.5 rounded-full bg-primary transform scale-0 peer-checked:scale-100 transition-transform"></span></span>
              <span className="ml-2 text-on-surface">Farmer Drop-off</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}