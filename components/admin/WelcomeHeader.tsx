// src/components/admin/WelcomeHeader.tsx
import { CirclePlus, Database, Milestone, Wheat, Beaker, CheckSquare } from 'lucide-react';
import { Season } from './Navbar'; // Import the Season type

// Define the complete props for the component
type WelcomeHeaderProps = {
  onAddLandmarkClick: () => void;
  onAddVarietyClick: () => void;
  onEnterSampleDataClick: () => void; // Added for Harvesting
  onApprovePricesClick: () => void;   // Added for Harvesting
  activeSeason: Season;               // To determine which buttons to show
};

// Helper component for action buttons for consistency
const ActionButton = ({ onClick, Icon, label, bgColor }: { onClick?: () => void, Icon: React.ElementType, label: string, bgColor: string }) => (
    <div className="text-center">
        <button
            onClick={onClick}
            // Add disabled state if onClick is not provided, though handled by conditional rendering below
            disabled={!onClick}
            className={`btn w-16 h-16 ${bgColor} rounded-m3-large flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <Icon className={`h-8 w-8 ${
                bgColor.includes('secondary') ? 'text-on-secondary-container' :
                bgColor.includes('tertiary') ? 'text-on-tertiary-container' :
                'text-on-primary-container' // Default for primary/others
            }`} />
        </button>
        <p className="text-xs mt-2 font-medium text-on-surface-variant">{label}</p>
    </div>
);

export default function WelcomeHeader({
    onAddLandmarkClick,
    onAddVarietyClick,
    onEnterSampleDataClick,
    onApprovePricesClick,
    activeSeason
}: WelcomeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-normal text-on-surface">Welcome Back, Admin!</h2>
        <p className="text-on-surface-variant">Let's work</p>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Conditionally render buttons based on activeSeason */}
        {activeSeason === 'Sowing' && (
          <>
            <ActionButton onClick={onAddLandmarkClick} Icon={Milestone} label="Add Landmark" bgColor="bg-secondary-container" />
            <ActionButton onClick={onAddVarietyClick} Icon={Wheat} label="Add Variety" bgColor="bg-tertiary-container" />
            {/* Add onClick handlers for Start Cycle and Master Data if they exist */}
            <ActionButton Icon={CirclePlus} label="Start Cycle" bgColor="bg-primary-container" />
            <ActionButton Icon={Database} label="Master Data" bgColor="bg-primary-container" />
          </>
        )}
        {activeSeason === 'Harvesting' && (
           <>
             {/* New buttons for Harvesting */}
             <ActionButton onClick={onEnterSampleDataClick} Icon={Beaker} label="Enter Sample Data" bgColor="bg-secondary-container" />
             <ActionButton onClick={onApprovePricesClick} Icon={CheckSquare} label="Approve Prices" bgColor="bg-tertiary-container" />
           </>
        )}
         {/* Add Growing season buttons here later if needed */}
      </div>
    </div>
  );
}