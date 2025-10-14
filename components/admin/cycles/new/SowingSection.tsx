// @/components/admin/cycles/new/SowingSection.tsx
"use client";
import { Tractor } from 'lucide-react';
import type { Landmark, SeedVariety } from '@/lib/definitions';
import { Input, Select } from '@/components/ui/FormInputs';

type Props = {
    cycleState: [any, Function];
    landmarks: Landmark[];
    seedVarieties: SeedVariety[];
}

export const SowingSection = ({ cycleState, landmarks, seedVarieties }: Props) => {
    const [cycleData, setCycleData] = cycleState;

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value, type } = e.target;
        setCycleData((prev: any) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };
    
    return (
        <div className="form-section-card">
          <div className="section-header"><div className="icon-container bg-tertiary-container"><Tractor className="w-6 h-6 text-on-tertiary-container" /></div><h2 className="section-title">Sowing Details</h2></div>
          <div className="flex flex-col gap-6">
              <Select id="landmarkId" name="landmarkId" label="Landmark" value={cycleData.landmarkId} onChange={handleChange} required>
                  {landmarks.map(l => <option key={l.landmark_id} value={l.landmark_id}>{l.landmark_name}</option>)}
              </Select>
              <Select id="seedId" name="seedId" label="Seed Variety" value={cycleData.seedId} onChange={handleChange} required>
                  {seedVarieties.map(s => <option key={s.seed_id} value={s.seed_id}>{s.variety_name}</option>)}
              </Select>
              <Input type="number" id="bags" name="bags" label="Seed Bags" value={cycleData.bags} onChange={handleChange} required onWheel={(e) => (e.target as HTMLElement).blur()} />
              <Input type="date" id="date" name="date" label="Sowing Date" value={cycleData.date} onChange={handleChange} required />
              <div>
                  <p className="text-sm text-on-surface-variant mb-2">Goods Collection Method</p>
                  <div className="flex items-center gap-6">
                      <label className="flex items-center cursor-pointer"><input type="radio" name="collection" value="RudraSeeds Pickup" checked={cycleData.collection === 'RudraSeeds Pickup'} onChange={handleChange} className="sr-only peer" /><div className="radio-custom"></div><span className="ml-2">RudraSeeds Pickup</span></label>
                      <label className="flex items-center cursor-pointer"><input type="radio" name="collection" value="Farmer Drop-off" checked={cycleData.collection === 'Farmer Drop-off'} onChange={handleChange} className="sr-only peer" /><div className="radio-custom"></div><span className="ml-2">Farmer Drop-off</span></label>
                  </div>
              </div>
        </div>
      </div>
    )
}