// app/employee/harvesting/sample/[cycle_id]/SampleForm.tsx
"use client";

import { useState, useMemo, useActionState } from 'react';
import { CycleForHarvesting } from '@/lib/definitions';
import { enterSampleData } from '@/app/employee/harvesting/actions';
import { Input, Select, Textarea } from '@/components/ui/FormInputs';
import { ArrowLeft, Info, Beaker, Weight, Save } from 'lucide-react';
import Link from 'next/link';

type Props = {
  cycle: CycleForHarvesting;
  userRole: 'Admin' | 'Employee';
};

const initialState = { message: '', success: false, errors: {} };

export default function SampleForm({ cycle, userRole }: Props) {
  const [state, formAction] = useActionState(enterSampleData, initialState);

  const [formData, setFormData] = useState({
    goods_collection_method: cycle.goods_collection_method,
    lot_no: cycle.lot_no || '',
    moisture: cycle.sample_moisture || '',
    purity: cycle.sample_purity || '',
    dust: cycle.sample_dust || '',
    colors: cycle.sample_colors || '',
    non_seed: cycle.sample_non_seed || '',
    remarks: cycle.sample_remarks || '',
    price: cycle.final_price_per_man || '',
    total_bags_weighed: cycle.total_bags_weighed || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const productionCutoff = useMemo(() => {
    const bagsPurchased = cycle.seed_bags_purchased || 0;
    const bagsReturned = cycle.seed_bags_returned || 0;
    const netBags = bagsPurchased - bagsReturned;
    return netBags * 50;
  }, [cycle.seed_bags_purchased, cycle.seed_bags_returned]);

  const isProductionFlagged = useMemo(() => {
      if (!formData.total_bags_weighed) return false;
      return Number(formData.total_bags_weighed) > productionCutoff;
  }, [formData.total_bags_weighed, productionCutoff]);

  const netWeightKg = Number(formData.total_bags_weighed || 0) * 50;
  const netWeightMan = netWeightKg / 20;

  return (
    <form action={formAction} className="max-w-xl mx-auto flex flex-col gap-6 p-4">
      <input type="hidden" name="cropCycleId" value={cycle.crop_cycle_id} />
      <input type="hidden" name="userRole" value={userRole} />

      {/* --- Header --- */}
       <header className="flex items-center gap-4">
          <Link href="/employee/dashboard" className="p-2 rounded-full hover:bg-surface-container">
              <ArrowLeft className="text-on-surface" />
          </Link>
          <div>
              <h1 className="text-2xl font-medium text-on-surface">{cycle.farmer_name}</h1>
              <p className="text-on-surface-variant">{cycle.seed_variety}</p>
          </div>
      </header>

      {/* --- Section 1: Cycle Details --- */}
      <div className="bg-surface-container rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-medium text-on-surface">વિગત</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-on-surface-variant">લેન્ડમાર્ક</p><p className="font-medium text-on-surface">{cycle.landmark_name}</p></div>
            <div><p className="text-on-surface-variant">લણણીની તારીખ</p><p className="font-medium text-on-surface">{cycle.harvesting_date ? new Date(cycle.harvesting_date).toLocaleDateString('gu-IN') : 'N/A'}</p></div>
        </div>
         <Input id="lot_no" name="lot_no" label="લોટ નંબર" value={formData.lot_no} onChange={handleChange} />
         <Select id="goods_collection_method" name="goods_collection_method" label="માલ સંગ્રહ પદ્ધતિ" value={formData.goods_collection_method} onChange={handleChange}>
            <option value="Farm">ફાર્મ</option>
            <option value="Yard">યાર્ડ</option>
         </Select>
      </div>

      {/* --- Section 2: Sample Quality --- */}
      <div className="bg-surface-container rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-4">
            <Beaker className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-medium text-on-surface">નમૂનાની વિગતો</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Input id="moisture" name="moisture" label="ભેજ (%)" type="number" value={formData.moisture} onChange={handleChange} required />
            <Input id="purity" name="purity" label="શુદ્ધતા (%)" type="number" value={formData.purity} onChange={handleChange} required />
            <Input id="dust" name="dust" label="ધૂળ (%)" type="number" value={formData.dust} onChange={handleChange} required />
            <Select id="colors" name="colors" label="કલર" value={formData.colors} onChange={handleChange} required>
                <option value="White">સફેદ</option>
                <option value="Good">સારો</option>
                <option value="Excellent">ઉત્તમ</option>
            </Select>
            <Select id="non_seed" name="non_seed" label="બિન-બીજ" value={formData.non_seed} onChange={handleChange} required className="col-span-2">
                <option value="High">વધુ</option>
                <option value="Less">ઓછું</option>
                <option value="Rare">નહિવત્</option>
            </Select>
            <Textarea id="remarks" name="remarks" label="રિમાર્ક (વૈકલ્પિક)" value={formData.remarks} onChange={handleChange} className="col-span-2" />
        </div>
      </div>

      {/* --- Section 3 & 4: Pricing & Weighing --- */}
      <div className="bg-surface-container rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-4">
            <Weight className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-medium text-on-surface">વજન અને ભાવ</h2>
        </div>
        <Input id="price" name="price" label="ફાઇનલ ભાવ (₹ પ્રતિ મણ)" type="number" value={formData.price} onChange={handleChange} disabled={userRole !== 'Admin'} placeholder={userRole !== 'Admin' ? 'એડમિન દ્વારા દાખલ કરવામાં આવશે' : ''} />
        
        <div className="relative">
            <Input id="total_bags_weighed" name="total_bags_weighed" label="કુલ બેગ" type="number" value={formData.total_bags_weighed} onChange={handleChange} required className={isProductionFlagged ? 'border-error focus-within:border-error' : ''} />
            {isProductionFlagged && <p className="text-xs text-error mt-1 px-4">ચેતવણી: ઉત્પાદન અપેક્ષા કરતા વધારે છે (મહત્તમ: {productionCutoff} બેગ).</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline/30">
            <div><p className="text-on-surface-variant">કુલ વજન (કિલો)</p><p className="font-bold text-lg text-on-surface">{netWeightKg.toFixed(2)} કિલો</p></div>
            <div><p className="text-on-surface-variant">કુલ વજન (મણ)</p><p className="font-bold text-lg text-on-surface">{netWeightMan.toFixed(2)} મણ</p></div>
        </div>
      </div>

      {/* --- Submission --- */}
      <div className="mt-4">
        <button type="submit" className="w-full h-14 flex items-center justify-center gap-2 text-base font-medium rounded-full bg-primary text-on-primary hover:shadow-lg transition-shadow">
            <Save className="w-5 h-5" />
            માહિતી સેવ કરો
        </button>
        {state?.message && !state.success && <p className="mt-4 text-center text-sm text-error">{state.message}</p>}
      </div>
    </form>
  );
}