// src/components/admin/WelcomeHeader.tsx
import { CirclePlus, Database, Milestone, Wheat, Beaker, CheckSquare, Edit3, DollarSign, ListChecks } from 'lucide-react'; // Added Edit3, DollarSign
import { Season } from './Navbar'; // Import the Season type

// Define the complete props for the component
type WelcomeHeaderProps = {
  onAddLandmarkClick: () => void;
  onAddVarietyClick: () => void;
  onEnterSampleDataClick: () => void;   // For Admin Button 1 (Sample Collected list)
  onSetTemporaryPriceClick: () => void; // For Admin Button 2 (Sampled list)
  onVerifyPriceClick: () => void;       // For Admin Button 3 (Price Proposed list)
  activeSeason: Season;                 // To determine which buttons to show
};

// Helper component for action buttons for consistency
const ActionButton = ({ onClick, Icon, label, bgColor }: { onClick?: () => void, Icon: React.ElementType, label: string, bgColor: string }) => (
    <div className="text-center">
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`w-16 h-16 ${bgColor} rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed`} // Changed to rounded-xl
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
    onEnterSampleDataClick, // Added prop
    onSetTemporaryPriceClick, // Added prop
    onVerifyPriceClick, // Added prop
    activeSeason
}: WelcomeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-normal text-on-surface">Welcome Back, Admin!</h2>
        <p className="text-on-surface-variant">Manage the {activeSeason} phase.</p> {/* Updated text */}
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2"> {/* Added flex-wrap and gap-y */}
        {/* Sowing Buttons */}
        {activeSeason === 'Sowing' && (
          <>
            <ActionButton onClick={onAddLandmarkClick} Icon={Milestone} label="Add Landmark" bgColor="bg-secondary-container" />
            <ActionButton onClick={onAddVarietyClick} Icon={Wheat} label="Add Variety" bgColor="bg-tertiary-container" />
            <ActionButton onClick={() => { /* Add Cycle Logic */ }} Icon={CirclePlus} label="Start Cycle" bgColor="bg-primary-container" />
            <ActionButton onClick={() => { /* Master Data Logic */ }} Icon={Database} label="Master Data" bgColor="bg-primary-container" />
          </>
        )}
        {/* Harvesting Buttons */}
        {activeSeason === 'Harvesting' && (
           <>
             {/* Use Beaker for entering initial sample data */}
             <ActionButton onClick={onEnterSampleDataClick} Icon={Beaker} label="Enter Sample Data" bgColor="bg-secondary-container" />
             {/* Use Edit3 (pencil icon) for adding temporary price to already sampled cycles */}
             <ActionButton onClick={onSetTemporaryPriceClick} Icon={Edit3} label="Set Temp Price" bgColor="bg-tertiary-container" />
              {/* Use CheckSquare for verifying/confirming the proposed price */}
             <ActionButton onClick={onVerifyPriceClick} Icon={CheckSquare} label="Verify Prices" bgColor="bg-primary-container" />
             {/* Shipment/Cheque verification button can stay or be moved */}
             {/* <ActionButton onClick={() => {}} Icon={ListChecks} label="Verify Cheques" bgColor="bg-surface-container" /> */}

           </>
        )}
         {/* Add Growing season buttons here later if needed */}
         {activeSeason === 'Growing' && (
             <p className="text-sm text-on-surface-variant">Growing season actions TBD.</p> // Placeholder
         )}
      </div>
    </div>
  );
}