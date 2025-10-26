// src/components/admin/Navbar.tsx
"use client";

import { Leaf, Bell, Settings, Users, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react'; // Added hooks for dropdown
import { signOut } from 'next-auth/react'; // Added signOut

export type Season = 'Sowing' | 'Growing' | 'Harvesting';

type NavbarProps = {
  activeSeason: Season;
  onSeasonChange: (season: Season) => void;
};

export default function Navbar({ activeSeason, onSeasonChange }: NavbarProps) {
  const seasons: Season[] = ['Sowing', 'Growing', 'Harvesting'];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for detecting outside clicks

  const getButtonClass = (season: Season) => {
    const baseClass = "btn px-5 py-2 rounded-m3-full font-medium transition-all duration-300 text-sm"; // Added text-sm
    if (season === activeSeason) {
      return `${baseClass} bg-gradient-to-br from-primary to-tertiary text-on-primary shadow-m3-active`;
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
    setIsDropdownOpen(false); // Close dropdown first
    await signOut({ callbackUrl: '/' }); // Sign out and redirect to login page
  };

  return (
    <header className="sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between w-full h-20 px-4">
        <Link href="/admin/dashboard" className="btn flex items-center gap-2">
          <Leaf className="text-primary" />
          <h1 className="text-xl font-medium text-on-surface">RudraSeeds</h1>
        </Link>

        <div className="flex items-center justify-center p-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-m3-full text-sm">
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

        <div className="flex items-center space-x-2 relative" ref={dropdownRef}> {/* Added relative positioning and ref */}
          <button className="btn p-2 rounded-full hover:bg-black/10">
            <Bell className="text-on-surface-variant" />
          </button>

          {/* Avatar Button */}
          <button
             onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle dropdown
             className="flex items-center gap-1 p-1 rounded-full hover:bg-black/10"
             aria-haspopup="true"
             aria-expanded={isDropdownOpen}
           >
            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-semibold">
              AD {/* Placeholder for Admin initials/image */}
            </div>
             <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-surface-container rounded-lg shadow-lg border border-outline/20 py-1 z-20">
              {/* Settings Item */}
              <Link
                href="/admin/settings"
                onClick={() => setIsDropdownOpen(false)} // Close on click
                className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/10 hover:text-on-surface"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              {/* Manage Users Item */}
              <Link
                href="/admin/users" // Link to the future users page
                onClick={() => setIsDropdownOpen(false)} // Close on click
                className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/10 hover:text-on-surface"
              >
                <Users className="w-4 h-4" />
                Manage Users
              </Link>
              {/* Separator */}
              <div className="h-px bg-outline/20 my-1"></div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}