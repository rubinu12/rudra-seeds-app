// src/components/admin/Navbar.tsx
"use client";
import { Leaf, Bell } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="h-16">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between w-full h-full px-4">
            <Link href="/admin/dashboard" className="btn flex items-center gap-2">
              <Leaf className="text-brand-text" />
              <h1 className="text-xl font-bold text-brand-text">RudraSeeds</h1>
            </Link>
            
            <div className="flex items-center gap-2 text-sm">
                <Link href="#" className="btn px-4 py-2 rounded-full bg-brand-active text-white font-medium shadow-md">Sowing</Link>
                <Link href="#" className="btn px-4 py-2 text-brand-text-light font-medium bg-brand-active/10 rounded-full">Growing</Link>
                <Link href="#" className="btn px-4 py-2 text-brand-text-light font-medium bg-brand-active/10 rounded-full">Harvesting</Link>
            </div>

            <div className="flex items-center space-x-4">
                <button className="btn p-2 rounded-full">
                  <Bell className="text-brand-text-light" />
                </button>
                <div className="w-9 h-9 bg-brand-active rounded-full flex items-center justify-center text-white font-semibold text-sm">AD</div>
            </div>
        </div>
    </header>
  );
}