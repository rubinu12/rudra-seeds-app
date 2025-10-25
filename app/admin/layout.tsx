// src/app/admin/layout.tsx
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Remove the <main> tag from the layout,
    // let the page component handle its own main container and spacing.
    <>
      {children}
    </>
  );
}