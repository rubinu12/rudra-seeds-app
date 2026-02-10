import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/src/components/AuthProvider"; // Ensure you copied this component!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rudra Seeds Platform",
  description: "Seed Organizer Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        {/* AuthProvider makes session data available to client components */}
        <AuthProvider>
          {children}
          {/* Toaster handles all success/error popups */}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
