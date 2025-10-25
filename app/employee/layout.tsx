// app/employee/layout.tsx
import React from 'react';
// Removed Link import as it's no longer used here

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* HEADER REMOVED FROM LAYOUT to prevent duplication */}
      {/*
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
      */}
      {/* Apply pt-0 if header is removed, otherwise adjust based on fixed header height */}
      <main className="pt-0"> {/* Changed pt-16 to pt-0 */}
        {children}
      </main>
    </>
  );
}