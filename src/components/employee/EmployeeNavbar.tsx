"use client";

import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Sprout } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function EmployeeNavbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: '/' }); 
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 bg-surface/80 backdrop-blur-xl border-b border-outline/10 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand / Home Link */}
        <Link href="/employee/dashboard" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-on-surface leading-tight">Rudra</h1>
            <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Field App</p>
          </div>
        </Link>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-surface-container border border-outline/10 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary text-xs font-bold shadow-sm">
              EMP
            </div>
            <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-surface rounded-2xl shadow-xl border border-outline/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-outline/10 bg-surface-container/30">
                <p className="text-xs font-medium text-on-surface-variant">Signed in as</p>
                <p className="text-sm font-bold text-on-surface truncate">Field Employee</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-error hover:bg-error/5 active:bg-error/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}