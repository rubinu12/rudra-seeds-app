import { ReactNode } from "react";
import { AdminProvider } from "@/src/components/admin/AdminProvider";

export default function AdminV2Layout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Main Content Wrapper */}
        <div className="flex-1">{children}</div>
      </div>
    </AdminProvider>
  );
}
