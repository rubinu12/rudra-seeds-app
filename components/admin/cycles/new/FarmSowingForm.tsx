// components/admin/cycles/new/FarmSowingForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { FarmerDetails, Landmark, SeedVariety } from '@/lib/definitions';
import { Tractor, PlusCircle, ChevronDown } from 'lucide-react';

type Props = {
  farmer: FarmerDetails | null;
  landmarks: Landmark[];
  seedVarieties: SeedVariety[];
  onSeedBagsChange: (bags: number) => void;
};

export default function FarmSowingForm({ farmer, landmarks, seedVarieties, onSeedBagsChange }: Props) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const hasExistingFarms = farmer && farmer.farms.length > 0;

  useEffect(() => {
    setIsAddingNew(!hasExistingFarms);
  }, [farmer, hasExistingFarms]);

  // Don't render if no farmer is selected
  if (!farmer) {
    return null;
  }

  return (
    <div className="form-section-card" style={{ background: 'rgba(255, 216, 228, 0.25)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-tertiary-container p-3 rounded-m3-large shadow-sm">
            <Tractor className="h-6 w-6 text-on-tertiary-container" />
          </div>
          <h2 className="text-2xl font-normal text-on-surface">Farm & Sowing Details</h2>
        </div>
        {hasExistingFarms && !isAddingNew && (
            <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="btn px-4 py-2 font-medium rounded-m3-full text-tertiary-dark bg-tertiary-container/60 hover:bg-tertiary-container flex items-center gap-2 text-sm"
            >
                <PlusCircle className="h-4 w-4" />
                Add New Farm
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {(hasExistingFarms && !isAddingNew) ? (
          <>
            {/* SELECT EXISTING FARM MODE */}
            <div className="lg:col-span-3">
              <label htmlFor="farm_id" className="form-label">Select Existing Farm</label>
              <div className="relative">
                <select id="farm_id" name="farm_id" className="form-select">
                  <option value="">Select a farm...</option>
                  {farmer.farms.map((farm) => (
                    <option key={farm.farm_id} value={farm.farm_id}>
                      {farm.location_name} ({farm.area_in_vigha} Vigha)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ADD NEW FARM FORM MODE */}
            <div>
              <label htmlFor="location_name" className="form-label">Farm Location</label>
              <input type="text" id="location_name" name="location_name" className="form-input" placeholder="e.g., Field near river" required />
            </div>
            <div>
              <label htmlFor="landmark_id" className="form-label">Landmark</label>
              <div className="relative">
                <select id="landmark_id" name="landmark_id" className="form-select" required>
                  <option value="">Select a landmark...</option>
                  {landmarks.map(landmark => (
                    <option key={landmark.landmark_id} value={landmark.landmark_id}>{landmark.landmark_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="area_in_vigha" className="form-label">Area of Farm (Vigha)</label>
              <input type="number" id="area_in_vigha" name="area_in_vigha" className="form-input" placeholder="e.g., 15" required />
            </div>
          </>
        )}

        {/* --- Sowing Details --- */}
        <div className="lg:col-span-3 pt-4 border-t border-outline/20 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
                <label htmlFor="seed_id" className="form-label">Seed Variety</label>
                <div className="relative">
                    <select id="seed_id" name="seed_id" className="form-select" required>
                        <option value="">Select a variety...</option>
                        {seedVarieties.map(seed => (
                          <option key={seed.seed_id} value={seed.seed_id}>{seed.variety_name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant pointer-events-none" />
                </div>
            </div>
            <div>
                <label htmlFor="seed_bags_purchased" className="form-label">Seed Bags Purchased</label>
                <input 
                    type="number" 
                    id="seed_bags_purchased" 
                    name="seed_bags_purchased" 
                    className="form-input" 
                    placeholder="e.g., 10"
                    onChange={(e) => onSeedBagsChange(Number(e.target.value))}
                    required 
                />
            </div>
            <div>
                <label htmlFor="sowing_date" className="form-label">Sowing Date</label>
                <input type="date" id="sowing_date" name="sowing_date" className="form-input" required />
            </div>
        </div>
      </div>
    </div>
  );
}