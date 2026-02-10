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
  onFinanceClick: () => void;
  activeSeason: Season;
};

// Helper component for action buttons
const ActionButton = ({ onClick, Icon, label, bgColor, isPending = false }: {
    onClick?: () => void,
    Icon: React.ElementType,
    label: string,
    bgColor: string,
    isPending?: boolean
}) => (
    <div className="text-center flex flex-col items-center"> 
        <button
            onClick={onClick}
            disabled={isPending || !onClick}
            className={`btn w-16 h-16 ${bgColor} rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-wait relative overflow-hidden`}
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
            {label}
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
    onFinanceClick,
    activeSeason
}: WelcomeHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Track which specific action is loading to show the spinner on just that button
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleStartCycleClick = () => {
    startTransition(() => {
      router.push('/admin/cycles/new');
    });
  };

  // Generic wrapper to handle loading state for async actions
  const handleActionClick = async (actionName: string, actionFn: () => void) => {
    setLoadingAction(actionName);
    
    // Execute the action (navigation or modal open)
    actionFn();
    
    // Reset the spinner after a short delay so it doesn't spin forever if the action is fast/sync
    // For navigation events (like Shipment Bill), the page will unload anyway.
    setTimeout(() => setLoadingAction(null), 1000); 
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-normal text-on-surface">Welcome Back, Admin!</h2>
        <p className="text-on-surface-variant">Manage the {activeSeason} phase.</p>
      </div>
      <div className="flex items-center space-x-4 flex-wrap gap-y-4"> 
        
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
                onClick={() => handleActionClick('edit', onEditCycleClick)}
                Icon={Edit}
                label="Edit Cycle"
                bgColor="bg-secondary-container"
                isPending={loadingAction === 'edit'}
            />
            <ActionButton Icon={Database} label="Master Data" bgColor="bg-surface-container" />
          </>
        )}
        
        {/* Harvesting Buttons */}
        {activeSeason === 'Harvesting' && (
           <>
             {/* Core Harvesting Buttons */}
             <ActionButton 
                onClick={() => handleActionClick('sample', onEnterSampleDataClick)} 
                Icon={Beaker} 
                label="Enter Samples" 
                bgColor="bg-secondary-container"
                isPending={loadingAction === 'sample'} 
             />
             <ActionButton 
                onClick={() => handleActionClick('tempPrice', onSetTemporaryPriceClick)} 
                Icon={Edit3} 
                label="Set Temp Price" 
                bgColor="bg-tertiary-container"
                isPending={loadingAction === 'tempPrice'}
             />
             <ActionButton 
                onClick={() => handleActionClick('verify', onVerifyPriceClick)} 
                Icon={CheckSquare} 
                label="Verify Prices" 
                bgColor="bg-primary-container"
                isPending={loadingAction === 'verify'}
             />

             {/* Billing & Payments Buttons */}
             <ActionButton
                onClick={() => handleActionClick('shipmentBill', onGenerateShipmentBillClick)}
                Icon={FileText}
                label="Shipment Bill"
                bgColor="bg-primary-container"
                isPending={loadingAction === 'shipmentBill'}
             />
             <ActionButton
                onClick={() => handleActionClick('payments', onProcessFarmerPaymentsClick)}
                Icon={IndianRupee}
                label="Farmer Payments"
                bgColor="bg-secondary-container"
                isPending={loadingAction === 'payments'}
             />
             
             {/* Finance Button */}
             <ActionButton
                onClick={() => handleActionClick('finance', onFinanceClick)}
                Icon={Briefcase}
                label="Manage Finance"
                bgColor="bg-tertiary-container"
                isPending={loadingAction === 'finance'}
             />
           </>
        )}
      </div>
    </div>
  );
}