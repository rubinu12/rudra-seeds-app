// src/app/layout.tsx
import type { Metadata } from "next";
import { Roboto } from 'next/font/google'; // Assuming Roboto, adjust if needed
import "./globals.css";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: "RudraSeeds Admin",
  description: "Seed Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>{children}</body>
    </html>
  );
}