// src/app/admin/layout.tsx
import Navbar from "@/components/admin/Navbar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">
        {children}
      </main>
    </>
  );
}