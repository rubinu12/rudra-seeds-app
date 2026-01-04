// src/components/admin/WelcomeHeader.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CirclePlus, Database, Edit, Beaker, CheckSquare, Edit3, FileText, IndianRupee, LoaderCircle, Briefcase } from 'lucide-react';
import { Season } from './Navbar';

// Define the complete props for the component
type WelcomeHeaderProps = {
  onEnterSampleDataClick: () => void;
  onSetTemporaryPriceClick: () => void;
  onVerifyPriceClick: () => void;
  onEditCycleClick: () => void;
  onGenerateShipmentBillClick: () => void; 
  onProcessFarmerPaymentsClick: () => void;
  onFinanceClick: () => void; // <--- NEW PROP
  activeSeason: Season;
};

// Helper component for action buttons (Preserved exactly as is)
const ActionButton = ({ onClick, Icon, label, bgColor, isPending = false }: {
    onClick?: () => void,
    Icon: React.ElementType,
    label: string,
    bgColor: string,
    isPending?: boolean
}) => (
    <div className="text-center">
        <button
            onClick={onClick}
            disabled={isPending || !onClick}
            className={`btn w-16 h-16 ${bgColor} rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-wait`}
        >
            {isPending ? (
                <LoaderCircle className="h-8 w-8 animate-spin text-on-primary-container opacity-70" />
            ) : (
                <Icon className={`h-8 w-8 ${
                    bgColor.includes('secondary') ? 'text-on-secondary-container' :
                    bgColor.includes('tertiary') ? 'text-on-tertiary-container' :
                    'text-on-primary-container'
                }`} />
            )}
        </button>
        <p className="text-xs mt-2 font-medium text-on-surface-variant">
            {isPending ? 'Loading...' : label}
        </p>
    </div>
);

export default function WelcomeHeader({
    onEnterSampleDataClick,
    onSetTemporaryPriceClick,
    onVerifyPriceClick,
    onEditCycleClick,
    onGenerateShipmentBillClick,
    onProcessFarmerPaymentsClick,
    onFinanceClick, // <--- Destructured
    activeSeason
}: WelcomeHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStartCycleClick = () => {
    startTransition(() => {
      router.push('/admin/cycles/new');
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-normal text-on-surface">Welcome Back, Admin!</h2>
        <p className="text-on-surface-variant">Manage the {activeSeason} phase.</p>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
        {/* Sowing Buttons */}
        {activeSeason === 'Sowing' && (
          <>
            <ActionButton
              onClick={handleStartCycleClick}
              Icon={CirclePlus}
              label="Start Cycle"
              bgColor="bg-primary-container"
              isPending={isPending}
            />
            <ActionButton
                onClick={onEditCycleClick}
                Icon={Edit}
                label="Edit Cycle"
                bgColor="bg-secondary-container"
            />
            <ActionButton Icon={Database} label="Master Data" bgColor="bg-surface-container" />
          </>
        )}
        {/* Harvesting Buttons */}
        {activeSeason === 'Harvesting' && (
           <>
             {/* Core Harvesting Buttons */}
             <ActionButton onClick={onEnterSampleDataClick} Icon={Beaker} label="Enter Samples" bgColor="bg-secondary-container" />
             <ActionButton onClick={onSetTemporaryPriceClick} Icon={Edit3} label="Set Temp Price" bgColor="bg-tertiary-container" />
             <ActionButton onClick={onVerifyPriceClick} Icon={CheckSquare} label="Verify Prices" bgColor="bg-primary-container" />

             {/* Billing & Payments Buttons */}
             <ActionButton
                onClick={onGenerateShipmentBillClick}
                Icon={FileText}
                label="Shipment Bill"
                bgColor="bg-primary-container"
             />
             <ActionButton
                onClick={onProcessFarmerPaymentsClick}
                Icon={IndianRupee}
                label="Farmer Payments"
                bgColor="bg-secondary-container"
             />
             
             {/* *** NEW FINANCE BUTTON *** */}
             <ActionButton
                onClick={onFinanceClick}
                Icon={Briefcase}
                label="Manage Finance"
                bgColor="bg-tertiary-container"
             />
           </>
        )}
         {/* Growing phase currently empty */}
      </div>
    </div>
  );
}