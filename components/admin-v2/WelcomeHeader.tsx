"use client";
import React from 'react';
import { Plus, Calendar, Bell, Settings, ChevronDown } from 'lucide-react';

const WelcomeHeader = ({ 
  userName = "Admin", 
  title = "Dashboard Overview", 
  subtitle = "Here is what's happening with your projects today." 
}) => {
  
  // Helper to get dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="w-full bg-white border-b border-gray-200 px-8 py-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Greeting & Context */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
            <span>{title}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-1 text-indigo-600">
              <Calendar size={14} />
              {currentDate}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{userName}</span>
          </h1>
          <p className="mt-1 text-gray-500">{subtitle}</p>
        </div>

        {/* Right Side: Redesigned Quick Actions */}
        <div className="flex items-center gap-3">
          
          {/* Secondary Actions (Icon only to save space) */}
          <button className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 border border-gray-200 bg-white shadow-sm group">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          
          <button className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 border border-gray-200 bg-white shadow-sm group">
            <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          </button>

          {/* Primary Action Button - Replaced the old "Quick Actions" */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
              <Plus size={18} />
              <span className="font-medium">Create New</span>
              <ChevronDown size={16} className="ml-1 opacity-70" />
            </button>
            
            {/* Dropdown Menu (Optional implementation) */}
            {/* This simulates the 'quick actions' but tucked away neatly */}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;