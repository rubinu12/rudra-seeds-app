"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sprout, Scale, Truck, Search, MapPin, Phone, 
  Beaker, CheckCircle2, AlertCircle, Filter, X 
} from 'lucide-react';

// --- THEME ENGINE ---
const THEMES: Record<string, { primary: string, bg: string, badge: string, border: string }> = {
  'Farm': { 
    primary: 'bg-green-600', 
    bg: 'bg-green-50', 
    badge: 'text-green-700 bg-green-100',
    border: 'border-green-200'
  },
  'Parabadi yard': { 
    primary: 'bg-blue-600', 
    bg: 'bg-blue-50', 
    badge: 'text-blue-700 bg-blue-100',
    border: 'border-blue-200'
  },
  'Dhoraji yard': { 
    primary: 'bg-purple-600', 
    bg: 'bg-purple-50', 
    badge: 'text-purple-700 bg-purple-100',
    border: 'border-purple-200'
  },
  'Jalasar yard': { 
    primary: 'bg-orange-600', 
    bg: 'bg-orange-50', 
    badge: 'text-orange-700 bg-orange-100',
    border: 'border-orange-200'
  }
};

// --- COMPONENTS ---

const SmartHeader = ({ location, setLocation, theme }: any) => (
  <div className={`sticky top-0 z-40 ${theme.primary} text-white shadow-lg transition-colors duration-500`}>
    <div className="px-4 py-4">
      {/* Top Row: Location & Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <select 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full appearance-none bg-white/20 backdrop-blur-md text-white font-bold text-sm px-4 py-3 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="Farm" className="text-gray-900">📍 Farm Direct</option>
            <option value="Parabadi yard" className="text-gray-900">🏭 Parabadi Yard</option>
            <option value="Dhoraji yard" className="text-gray-900">🏭 Dhoraji Yard</option>
            <option value="Jalasar yard" className="text-gray-900">🏭 Jalasar Yard</option>
          </select>
        </div>
        
        <button className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/30 font-medium text-sm">
          <Filter className="w-4 h-4" /> Landmark
        </button>
      </div>

      {/* Search Bar (Floating) */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search farmer..." 
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 shadow-md focus:outline-none"
        />
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
      </div>
    </div>
  </div>
);

const WorkflowTabs = ({ activeTab, setActiveTab, theme }: any) => {
  const tabs = [
    { id: 'harvest', label: 'Harvest', icon: Sprout },
    { id: 'sample', label: 'Sample', icon: Beaker },
    { id: 'weigh', label: 'Weigh', icon: Scale },
    { id: 'load', label: 'Load', icon: Truck },
  ];

  return (
    <div className="bg-white border-b border-gray-100 px-4 pt-2 sticky top-[124px] z-30 shadow-sm overflow-x-auto no-scrollbar">
      <div className="flex gap-6 min-w-max">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-1 pb-3 px-2 border-b-2 transition-all ${
                isActive 
                ? `border-[${theme.bg}] text-gray-900 font-bold scale-105` 
                : 'border-transparent text-gray-400 font-medium'
              }`}
              // Inline style for border color since Tailwind dynamic classes can be tricky
              style={{ borderColor: isActive ? 'currentColor' : 'transparent', color: isActive ? 'black' : undefined }}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs uppercase tracking-wide">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
};

const FarmerCard = ({ data, actionLabel, onAction, theme, type }: any) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
    {/* Status Stripe */}
    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.primary}`} />

    <div className="flex justify-between items-start pl-3">
      <div>
        <h3 className="font-bold text-gray-900 text-lg">{data.name}</h3>
        <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" /> {data.village} • {data.landmark}
        </p>
      </div>
      <div className="flex gap-2">
        <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-200">
          <Phone className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Seed Info */}
    <div className="pl-3 flex items-center gap-2">
      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-700">
        {data.seed}
      </span>
      {data.bags && (
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${theme.badge}`}>
          {data.bags} Bags
        </span>
      )}
    </div>

    {/* Action Button */}
    <div className="pl-3 pt-2">
      <button 
        onClick={onAction}
        className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 ${theme.primary}`}
      >
        {type === 'toggle' ? (
           <div className="flex items-center gap-2">
             <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
               <CheckCircle2 className="w-3 h-3" />
             </div>
             {actionLabel}
           </div>
        ) : (
           actionLabel
        )}
      </button>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function PrototypePage() {
  const [location, setLocation] = useState('Farm');
  const [activeTab, setActiveTab] = useState('harvest');
  const theme = THEMES[location] || THEMES['Farm'];

  // Mock Data for each stage
  const renderContent = () => {
    switch(activeTab) {
      case 'harvest':
        return (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-white/50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pending Harvest (3)
            </div>
            <div className="px-4 space-y-3 pb-24">
              <FarmerCard 
                data={{ name: 'Ramesh Patel', village: 'Parabadi', landmark: 'Near Temple', seed: 'GW-496' }}
                actionLabel="Mark as Harvested"
                type="toggle"
                theme={theme}
              />
              <FarmerCard 
                data={{ name: 'Suresh Kumar', village: 'Dhoraji', landmark: 'Main Road', seed: 'Lokwan' }}
                actionLabel="Mark as Harvested"
                type="toggle"
                theme={theme}
              />
            </div>
          </div>
        );
      case 'sample':
        return (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-white/50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Collect Samples (2)
            </div>
            <div className="px-4 space-y-3 pb-24">
              <FarmerCard 
                data={{ name: 'Mahesh Vaghani', village: 'Jalasar', landmark: 'Old Well', seed: 'Cumin' }}
                actionLabel="Confirm Sample Collected"
                type="toggle"
                theme={theme}
              />
            </div>
          </div>
        );
      case 'weigh':
        return (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-white/50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ready to Weigh (Priced)
            </div>
            <div className="px-4 space-y-3 pb-24">
              <FarmerCard 
                data={{ name: 'Rajesh Bhai', village: 'Parabadi', landmark: 'School', seed: 'GW-496' }}
                actionLabel="Start Weighing"
                theme={theme}
              />
            </div>
          </div>
        );
      case 'load':
        return (
          <div className="space-y-4">
            {/* Active Shipment Card */}
            <div className="mx-4 mt-4 p-4 bg-gray-900 text-white rounded-2xl shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Current Shipment</p>
                  <h3 className="text-xl font-bold">Truck GJ-03-BW-9090</h3>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-green-400">
                  Loading
                </div>
              </div>
              <div className="flex gap-4 text-sm mb-4">
                <div>
                  <span className="block text-gray-500 text-xs">Total Bags</span>
                  <span className="font-mono font-bold text-lg">450</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs">Weight</span>
                  <span className="font-mono font-bold text-lg">22.5T</span>
                </div>
              </div>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl text-sm">
                View Details
              </button>
            </div>

            <div className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Available to Load (Weighed)
            </div>
            <div className="px-4 space-y-3 pb-24">
              <FarmerCard 
                data={{ name: 'Kishan Bhai', village: 'Dhoraji', landmark: 'River', seed: 'Lokwan', bags: 120 }}
                actionLabel="Add to Shipment"
                theme={theme}
              />
            </div>
          </div>
        );
      default: return null;
    }
  }

  return (
    <div className={`min-h-screen bg-rose-50/50 font-sans`}> {/* Light Reddish BG */}
      <SmartHeader location={location} setLocation={setLocation} theme={theme} />
      <WorkflowTabs activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
      
      <div className="pt-2">
        {renderContent()}
      </div>
    </div>
  );
}