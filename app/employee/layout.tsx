// app/employee/layout.tsx
import React from 'react';
import Link from 'next/link';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline/30 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between h-full px-4">
          <Link href="/employee/dashboard" className="text-xl font-bold text-primary">
            RudraSeeds
          </Link>
          <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-semibold">
            EM
          </div>
        </div>
      </header>
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}