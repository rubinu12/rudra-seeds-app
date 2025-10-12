// src/components/admin/WelcomeHeader.tsx
import { CirclePlus, Database, Milestone, Wheat } from 'lucide-react';

type WelcomeHeaderProps = {
  onAddLandmarkClick: () => void;
  onAddVarietyClick: () => void;
};

export default function WelcomeHeader({ onAddLandmarkClick, onAddVarietyClick }: WelcomeHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-normal text-on-surface">Welcome Back, Admin!</h2>
        <p className="text-on-surface-variant">Let's work</p>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-center">
          <button onClick={onAddLandmarkClick} className="btn w-16 h-16 bg-secondary-container rounded-m3-large flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <Milestone className="h-8 w-8 text-on-secondary-container" />
          </button>
          <p className="text-xs mt-2 font-medium text-on-surface-variant">Add Landmark</p>
        </div>
        <div className="text-center">
          <button onClick={onAddVarietyClick} className="btn w-16 h-16 bg-tertiary-container rounded-m3-large flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <Wheat className="h-8 w-8 text-on-tertiary-container" />
          </button>
          <p className="text-xs mt-2 font-medium text-on-surface-variant">Add Variety</p>
        </div>
        <div className="text-center">
          <button className="btn w-16 h-16 bg-primary-container rounded-m3-large flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <CirclePlus className="h-8 w-8 text-on-primary-container" />
          </button>
          <p className="text-xs mt-2 font-medium text-on-surface-variant">Start Cycle</p>
        </div>
        <div className="text-center">
          <button className="btn w-16 h-16 bg-primary-container rounded-m3-large flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <Database className="h-8 w-8 text-on-primary-container" />
          </button>
          <p className="text-xs mt-2 font-medium text-on-surface-variant">Master Data</p>
        </div>
      </div>
    </div>
  );
}