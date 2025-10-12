// src/components/admin/Navbar.tsx
import { Leaf, Bell } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between w-full h-20 px-4">
        <Link href="/admin/dashboard" className="btn flex items-center gap-2">
          <Leaf className="text-primary" />
          <h1 className="text-xl font-medium text-on-surface">RudraSeeds</h1>
        </Link>
        
        <div className="flex items-center justify-center p-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-m3-full text-sm">
          <Link href="#" className="btn px-5 py-2 rounded-m3-full bg-gradient-to-br from-primary to-tertiary text-on-primary font-medium shadow-m3-active">
            Sowing
          </Link>
          <Link href="#" className="btn px-5 py-2 text-on-surface-variant font-medium">
            Growing
          </Link>
          <Link href="#" className="btn px-5 py-2 text-on-surface-variant font-medium">
            Harvesting
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <button className="btn p-2 rounded-full hover:bg-black/10">
            <Bell className="text-on-surface-variant" />
          </button>
          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-semibold">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}