import { AdminProvider } from "@/components/admin-v2/AdminProvider";
import Header from "@/components/admin-v2/Header";
import { Toaster } from "sonner";

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
        {/* Full Width Header */}
        <Header />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1920px] mx-auto p-6 md:p-8 lg:p-10">
            {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </AdminProvider>
  );
}