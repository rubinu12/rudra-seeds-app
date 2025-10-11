// src/components/admin/WelcomeHeader.tsx
import { CirclePlus, Database } from 'lucide-react';

export default function WelcomeHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-normal text-on-surface">Welcome Back, Admin!</h2>
        <p className="text-on-surface-variant">Let's work</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <button className="btn w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <CirclePlus className="h-8 w-8 text-on-primary-container" />
          </button>
          <p className="text-xs mt-2 font-medium text-on-surface-variant">Start Cycle</p>
        </div>
        <div className="text-center">
          <button className="btn w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <Database className="h-8 w-8 text-on-primary-container" />
          </button>
          <p className="text-xs mt-2 font-medium text-on-surface-variant">Master Data</p>
        </div>
      </div>
    </div>
  );
}