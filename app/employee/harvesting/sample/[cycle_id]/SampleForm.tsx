// app/employee/harvesting/sample/[cycle_id]/SampleForm.tsx
"use client";

import { useState, useMemo, useActionState, useEffect } from 'react';
import { CycleForHarvesting } from '@/lib/definitions';
import { enterSampleData } from '@/app/employee/harvesting/actions';
// Using FloatingLabel inputs/selects for consistency
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import FloatingLabelSelect from '@/components/ui/FloatingLabelSelect';
import { ArrowLeft, Info, Beaker, Save, Calendar, Phone, MapPin, Tag, Wheat, Milestone, Globe, Package } from 'lucide-react';
import Link from 'next/link';

type Props = {
  cycle: CycleForHarvesting;
  userRole: 'Admin' | 'Employee'; // Role determines if temp price is editable
};

// Define initial state for useActionState
const initialState = { message: '', success: false, errors: {} };

// Helper to calculate days difference
const calculateDaysDifference = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        const today = new Date();
        // Set both times to midnight UTC to compare dates only
        date.setUTCHours(0, 0, 0, 0);
        today.setUTCHours(0, 0, 0, 0);
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days ago`;
    } catch (e) {
        return 'Invalid date';
    }
};

// Helper to format date
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('gu-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return 'Invalid date';
    }
};

export default function SampleForm({ cycle, userRole }: Props) {
  const [state, formAction] = useActionState(enterSampleData, initialState);

  // Initialize form state with data from cycle prop
  const [formData, setFormData] = useState({
    goods_collection_method: cycle.goods_collection_method || 'Farm',
    moisture: cycle.sample_moisture ?? '', // Use ?? '' for null/undefined to empty string
    purity: cycle.sample_purity ?? '',
    dust: cycle.sample_dust ?? '',
    colors: cycle.sample_colors ?? '',
    non_seed: cycle.sample_non_seed ?? '',
    remarks: cycle.sample_remarks ?? '',
    temporary_price_per_man: cycle.temporary_price_per_man ?? '',
    // Removed lot_no and total_bags_weighed from form state
  });

  // Update state if cycle prop changes (e.g., revalidation)
  useEffect(() => {
    setFormData({
        goods_collection_method: cycle.goods_collection_method || 'Farm',
        moisture: cycle.sample_moisture ?? '',
        purity: cycle.sample_purity ?? '',
        dust: cycle.sample_dust ?? '',
        colors: cycle.sample_colors ?? '',
        non_seed: cycle.sample_non_seed ?? '',
        remarks: cycle.sample_remarks ?? '',
        temporary_price_per_man: cycle.temporary_price_per_man ?? '',
    });
  }, [cycle]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate days since harvest for display
  const daysSinceHarvest = calculateDaysDifference(cycle.harvesting_date);
  const formattedHarvestDate = formatDate(cycle.harvesting_date);

  return (
    <form action={formAction} className="max-w-xl mx-auto flex flex-col gap-6 p-4 pb-12">
      <input type="hidden" name="cropCycleId" value={cycle.crop_cycle_id} />
      <input type="hidden" name="userRole" value={userRole} />

      {/* --- Header --- */}
       <header className="flex items-center gap-4">
          <Link href="/employee/dashboard" className="p-2 -ml-2 rounded-full hover:bg-surface-container">
              <ArrowLeft className="text-on-surface" />
          </Link>
          <div>
              <h1 className="text-2xl font-medium text-on-surface">{cycle.farmer_name}</h1>
              <p className="text-on-surface-variant text-sm">{cycle.seed_variety}</p>
          </div>
      </header>

      {/* --- Section 1: Basic Cycle Info Display --- */}
      <div className="bg-surface-container rounded-3xl p-5 shadow-sm space-y-3 border border-outline/30">
         <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoItem icon={Tag} label="Lot No" value={cycle.lot_no || 'N/A'} />
            <InfoItem icon={Phone} label="Mobile" value={cycle.mobile_number || 'N/A'} />
            <InfoItem icon={Globe} label="Village" value={cycle.village_name || 'N/A'} />
            <InfoItem icon={Milestone} label="Landmark" value={cycle.landmark_name || 'N/A'} />
            <InfoItem icon={Calendar} label="Harvested" value={`${formattedHarvestDate} (${daysSinceHarvest})`} />
            <InfoItem icon={Package} label="Collection Method" value={cycle.goods_collection_method || 'N/A'} />
         </div>
      </div>


      {/* --- Section 2: Sample Quality Inputs --- */}
      <div className="bg-surface-container rounded-3xl p-6 shadow-sm space-y-4 border border-outline/30">
        <div className="flex items-center gap-3 mb-4">
            <Beaker className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-medium text-on-surface">નમૂનાની વિગતો</h2>
        </div>
        {/* Goods Collection Method - Editable */}
        <FloatingLabelSelect
            id="goods_collection_method"
            name="goods_collection_method"
            label="માલ સંગ્રહ પદ્ધતિ"
            value={formData.goods_collection_method}
            onChange={handleChange}
            required
        >
           <option value="Farm">Farm</option>
           <option value="Parabadi yard">Parabadi yard</option>
           <option value="Dhoraji yard">Dhoraji yard</option>
           <option value="Jalasar yard">Jalasar yard</option>
        </FloatingLabelSelect>

        <div className="grid grid-cols-2 gap-4">
            <FloatingLabelInput
                id="moisture"
                name="moisture"
                label="ભેજ (%)"
                type="number"
                step="0.01" // Allow decimals
                value={formData.moisture}
                onChange={handleChange}
                required
            />
            <FloatingLabelInput
                id="purity"
                name="purity"
                label="શુદ્ધતા (%)"
                type="number"
                step="0.01"
                value={formData.purity}
                onChange={handleChange}
                required
            />
            <FloatingLabelInput
                id="dust" // Keep ID simple
                name="dust" // Corresponds to dust_percentage column via action
                label="ધૂળ (%)"
                type="number"
                step="0.01"
                value={formData.dust}
                onChange={handleChange}
                required
            />
            <FloatingLabelSelect
                id="colors" // Keep ID simple
                name="colors" // Corresponds to color_grade column via action
                label="કલર"
                value={formData.colors}
                onChange={handleChange}
                required
            >
                <option value="" disabled hidden></option> {/* Placeholder */}
                <option value="White">સફેદ</option>
                <option value="Good">સારો</option>
                <option value="Excellent">ઉત્તમ</option>
            </FloatingLabelSelect>
            <FloatingLabelSelect
                id="non_seed"
                name="non_seed" // Corresponds to sample_non_seed column
                label="બિન-બીજ"
                value={formData.non_seed}
                onChange={handleChange}
                required
                className="col-span-2"
            >
                <option value="" disabled hidden></option> {/* Placeholder */}
                <option value="High">વધુ</option>
                <option value="Less">ઓછું</option>
                <option value="Rare">નહિવત્</option>
            </FloatingLabelSelect>
             <FloatingLabelInput
                as="textarea" // Use 'as' prop for textarea
                id="remarks"
                name="remarks" // Corresponds to sample_remarks column
                label="રિમાર્ક (વૈકલ્પિક)"
                value={formData.remarks}
                onChange={handleChange}
                className="col-span-2"
                rows={3} // Optional: suggest initial rows
            />
        </div>
      </div>

      {/* --- Section 3: Pricing (Admin Only Input) --- */}
      <div className="bg-surface-container rounded-3xl p-6 shadow-sm space-y-4 border border-outline/30">
        <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-primary" /> {/* Changed Icon */}
            <h2 className="text-xl font-medium text-on-surface">કાચો ભાવ (Admin Only)</h2>
        </div>
        <FloatingLabelInput
            id="temporary_price_per_man"
            name="temporary_price_per_man"
            label="કાચો ભાવ (₹ પ્રતિ મણ)"
            type="number"
            step="0.01"
            value={formData.temporary_price_per_man}
            onChange={handleChange}
            disabled={userRole !== 'Admin'} // Disable if not Admin
            placeholder={userRole !== 'Admin' ? ' ' : ''} // Need placeholder=" " for label float
            className={userRole !== 'Admin' ? 'bg-outline/10' : ''} // Style disabled input
        />
         {userRole !== 'Admin' && (
             <p className="text-xs text-on-surface-variant -mt-2 px-1">Only Admin can enter temporary price.</p>
         )}
      </div>

      {/* --- Submission --- */}
      <div className="mt-4">
        <button type="submit" className="w-full h-14 flex items-center justify-center gap-2 text-base font-medium rounded-full bg-primary text-on-primary hover:shadow-lg transition-shadow">
            <Save className="w-5 h-5" />
            માહિતી સેવ કરો
        </button>
        {/* Display Server Action Error Messages */}
        {state?.message && !state.success && (
            <p className="mt-4 text-center text-sm text-error bg-error-container p-3 rounded-lg">
                {state.message}
            </p>
        )}
         {/* Display specific field errors if available */}
         {state?.errors && Object.entries(state.errors).map(([field, errors]) => (
             errors && errors.length > 0 && (
                <p key={field} className="mt-2 text-center text-sm text-error">
                    {field}: {errors.join(', ')}
                 </p>
             )
         ))}
      </div>
    </form>
  );
}

// Helper component for info display items
const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 text-on-surface-variant flex-shrink-0" strokeWidth={1.5} />
        <div>
            <p className="text-xs text-on-surface-variant">{label}</p>
            <p className="font-medium text-on-surface break-words">{value}</p>
        </div>
    </div>
);