// @/components/admin/cycles/new/SowingSection.tsx
"use client";
import { Input } from '@/components/ui/FormInputs';
import SearchableSelect from '@/components/ui/SearchableSelect';

type Option = { value: string; label: string; };

type Props = {
    cycleState: [any, Function];
    landmarkOptions: Option[];
    seedVarietyOptions: Option[];
}

export const SowingSection = ({ cycleState, landmarkOptions, seedVarietyOptions }: Props) => {
    const [cycleData, setCycleData] = cycleState;

    const handleValueChange = (e: React.ChangeEvent<any>) => {
        const { name, value, type } = e.target;
        setCycleData((prev: any) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSelectChange = (name: string) => (value: string) => {
        setCycleData((prev: any) => ({ ...prev, [name]: value }));
    };
    
    return (
        <div className="bg-surface-container rounded-[1.75rem] p-6 shadow-md">
          <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 grid place-items-center rounded-2xl bg-primary-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="#21005D" strokeWidth="2"><path d="M17.5 2.5a2.5 2.5 0 0 1 0 5L16 6l-2.5 2.5L15 10l-2.5 2.5L14 14l-2.5 2.5L13 18l-2.5 2.5L9 19l-2.5-2.5L8 15l-2.5-2.5L7 11l-2.5-2.5L6 7l2.5-2.5L10 6Z"></path></svg>
              </div>
              <h2 className="text-[1.75rem] font-normal text-on-surface">Sowing Details</h2>
          </div>
          
          <div className="flex flex-col gap-4">
              <SearchableSelect
                  id="landmarkId"
                  name="landmarkId"
                  label="Landmark"
                  options={landmarkOptions}
                  value={cycleData.landmarkId}
                  onChange={handleSelectChange('landmarkId')}
              />
              <SearchableSelect
                  id="seedId"
                  name="seedId"
                  label="Seed Variety"
                  options={seedVarietyOptions}
                  value={cycleData.seedId}
                  onChange={handleSelectChange('seedId')}
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
              <Input 
                type="date" 
                id="date" 
                name="date" 
                label="Sowing Date" 
                value={cycleData.date} 
                onChange={handleValueChange} 
                required 
              />
              <div>
                  <p className="text-sm font-medium text-on-surface-variant mb-3">Goods Collection Method</p>
                  <div className="flex items-center gap-6">
                      <Radio 
                        id="pickup" 
                        name="collection" 
                        value="Farm" 
                        label="Farm"
                        checked={cycleData.collection === 'Farm'}
                        onChange={handleValueChange}
                      />
                      <Radio 
                        id="dropoff" 
                        name="collection" 
                        value="Yard" 
                        label="Yard"
                        checked={cycleData.collection === 'Yard'}
                        onChange={handleValueChange}
                      />
                  </div>
              </div>
        </div>
      </div>
    )
}

// Reusable Radio component for consistency
const Radio = ({ id, label, ...props }: { id: string, label: string } & React.ComponentProps<'input'>) => (
    <label htmlFor={id} className="flex items-center cursor-pointer text-on-surface">
        <input id={id} type="radio" className="sr-only peer" {...props} />
        <div className="w-5 h-5 border-2 border-outline rounded-full flex items-center justify-center peer-checked:border-primary">
            <div className="w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform"></div>
        </div>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);