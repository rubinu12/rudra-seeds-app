// app/employee/layout.tsx
import EmployeeNavbar from '@/components/employee/EmployeeNavbar';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center">
      {/* Container: Locked to mobile width, centered on desktop */}
      <div className="w-full max-w-[425px] min-h-screen bg-background shadow-2xl flex flex-col relative overflow-hidden">
        
        <EmployeeNavbar />
        
        <main className="flex-grow w-full relative overflow-y-auto custom-scrollbar">
          {children}
        </main>
        
      </div>
    </div>
  );
}