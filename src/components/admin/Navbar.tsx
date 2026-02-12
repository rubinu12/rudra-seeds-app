"use client";

import { Leaf, Bell, Settings, Users, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import GlobalSearch from './GlobalSearch'; // Import the new Search Component

export type Season = 'Sowing' | 'Growing' | 'Harvesting';

type NavbarProps = {
  activeSeason: Season;
  onSeasonChange: (season: Season) => void;
};

export default function Navbar({ activeSeason, onSeasonChange }: NavbarProps) {
  const seasons: Season[] = ['Sowing', 'Growing', 'Harvesting'];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getButtonClass = (season: Season) => {
    const baseClass = "px-4 py-1.5 rounded-full font-medium transition-all duration-300 text-xs"; // Made slightly smaller to fit search
    if (season === activeSeason) {
      return `${baseClass} bg-gradient-to-br from-primary to-tertiary text-on-primary shadow-sm`;
    }
    return `${baseClass} text-on-surface-variant hover:bg-black/5`;
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-outline/10">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-16 px-6 gap-4">
        
        {/* 1. LEFT: Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary shadow-sm">
             <Leaf className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-on-surface hidden md:block">Rudra<span className="text-primary">Seeds</span></h1>
        </Link>

        {/* 2. MIDDLE: Global Search (Takes available space) */}
        <div className="flex-1 flex justify-center max-w-2xl px-4">
           <GlobalSearch />
        </div>

        {/* 3. RIGHT: Seasons & User Profile */}
        <div className="flex items-center gap-4 shrink-0">
            
            {/* Season Selector (Moved to right to make room for search) */}
            <div className="hidden lg:flex items-center p-1 bg-surface-variant/30 rounded-full border border-outline/10">
              {seasons.map((season) => (
                <button
                  key={season}
                  onClick={() => onSeasonChange(season)}
                  className={getButtonClass(season)}
                >
                  {season}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-full hover:bg-black/5 text-on-surface-variant relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-black/5 transition-colors border border-transparent hover:border-outline/10"
                >
                <div className="flex flex-col items-end hidden md:block">
                    <span className="text-xs font-bold text-on-surface leading-none">Admin</span>
                    <span className="text-[10px] text-on-surface-variant leading-none">Head Office</span>
                </div>
                <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold text-xs">
                  AD
                </div>
                <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-outline/10 py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-4 py-2 border-b border-outline/10 mb-1 lg:hidden">
                     <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Active Season</p>
                     <div className="flex flex-col gap-1">
                        {seasons.map((s) => (
                            <button key={s} onClick={() => onSeasonChange(s)} className={`text-left text-xs py-1 px-2 rounded ${activeSeason === s ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'}`}>
                                {s}
                            </button>
                        ))}
                     </div>
                  </div>
                  
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <Settings className="w-4 h-4 text-on-surface-variant" />
                    Settings
                  </Link>
                  <Link
                    href="/admin/users"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <Users className="w-4 h-4 text-on-surface-variant" />
                    Manage Users
                  </Link>
                  
                  <div className="h-px bg-outline/10 my-1 mx-2"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}