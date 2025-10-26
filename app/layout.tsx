// src/app/layout.tsx
import type { Metadata } from "next";
import { Roboto } from 'next/font/google';
import { SessionProvider } from 'next-auth/react'; // Import SessionProvider
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
      <body className={`${roboto.className} text-on-surface`}>
        {/* Wrap the children with SessionProvider */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}