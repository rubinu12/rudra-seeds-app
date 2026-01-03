"use client";

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CirclePlus, Database, Edit, Beaker, CheckSquare, 
  Edit3, FileText, IndianRupee, LoaderCircle, Briefcase, 
  ChevronRight 
} from 'lucide-react';
import { Season } from './Navbar';

type WelcomeHeaderProps = {
  onEnterSampleDataClick: () => void;
  onSetTemporaryPriceClick: () => void;
  onVerifyPriceClick: () => void;
  onEditCycleClick: () => void;
  onGenerateShipmentBillClick: () => void; 
  onProcessFarmerPaymentsClick: () => void;
  onFinanceClick: () => void;
  activeSeason: Season;
};

// --- MODERN ACTION TILE COMPONENT ---
const ActionTile = ({ onClick, Icon, label, colorClass, isPending }: any) => (
    <button
        onClick={onClick}
        disabled={isPending}
        className="group relative flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-200 active:scale-[0.98] text-left w-full sm:w-auto min-w-[180px]"
    >
        {/* Icon Container with Dynamic Color */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${colorClass} group-hover:scale-110`}>
            {isPending ? (
                <LoaderCircle className="w-6 h-6 animate-spin" />
            ) : (
                <Icon className="w-6 h-6" strokeWidth={2} />
            )}
        </div>
        
        {/* Text Label */}
        <div className="flex-1">
            <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                {label}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 group-hover:text-purple-500 flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                Open <ChevronRight className="w-3 h-3" />
            </p>
        </div>
    </button>
);

export default function WelcomeHeader({
    onEnterSampleDataClick,
    onSetTemporaryPriceClick,
    onVerifyPriceClick,
    onEditCycleClick,
    onGenerateShipmentBillClick,
    onProcessFarmerPaymentsClick,
    onFinanceClick,
    activeSeason
}: WelcomeHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStartCycleClick = () => {
    startTransition(() => router.push('/admin/cycles/new'));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Title Section */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Harvest Command</h2>
        <p className="text-slate-500 font-medium mt-1">Manage operations for {activeSeason} Season 2024-25</p>
      </div>

      {/* 2. Modern Action Grid */}
      <div className="flex flex-wrap gap-4">
        
        {/* HARVESTING ACTIONS */}
        {activeSeason === 'Harvesting' && (
           <>
             <ActionTile 
                onClick={onEnterSampleDataClick} 
                Icon={Beaker} 
                label="Sample Entry" 
                colorClass="bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white" 
             />
             <ActionTile 
                onClick={onSetTemporaryPriceClick} 
                Icon={Edit3} 
                label="Set Price" 
                colorClass="bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" 
             />
             <ActionTile 
                onClick={onVerifyPriceClick} 
                Icon={CheckSquare} 
                label="Verify Price" 
                colorClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" 
             />
             <div className="w-px h-12 bg-slate-200 hidden sm:block self-center mx-2"></div> {/* Divider */}
             <ActionTile 
                onClick={onGenerateShipmentBillClick} 
                Icon={FileText} 
                label="Shipment Bill" 
                colorClass="bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" 
             />
             <ActionTile 
                onClick={onProcessFarmerPaymentsClick} 
                Icon={IndianRupee} 
                label="Payments" 
                colorClass="bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white" 
             />
             <ActionTile 
                onClick={onFinanceClick} 
                Icon={Briefcase} 
                label="Finance Hub" 
                colorClass="bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white" 
             />
           </>
        )}

        {/* SOWING ACTIONS */}
        {activeSeason === 'Sowing' && (
          <>
            <ActionTile
              onClick={handleStartCycleClick}
              Icon={CirclePlus}
              label="Start Cycle"
              colorClass="bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
              isPending={isPending}
            />
            <ActionTile
                onClick={onEditCycleClick}
                Icon={Edit}
                label="Edit Cycle"
                colorClass="bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
            />
            <ActionTile 
                onClick={() => {}} 
                Icon={Database} 
                label="Master Data" 
                colorClass="bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white" 
            />
          </>
        )}

      </div>
    </div>
  );
}