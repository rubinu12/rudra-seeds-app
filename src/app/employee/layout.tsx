import EmployeeNavbar from "@/src/components/employee/EmployeeNavbar";

export default function EmployeeV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Outer gray background (Desktop view)
    <div className="min-h-screen bg-gray-100/50 flex justify-center font-sans text-slate-900">
      {/* Mobile App Container - Locked Width */}
      <div className="w-full max-w-[425px] min-h-screen bg-[#FDFCF8] shadow-2xl relative flex flex-col overflow-hidden">
        {/* FIX: Wrapped Navbar in z-100 to stay above SmartHeader */}
        <div className="relative z-[100]">
          <EmployeeNavbar />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto custom-scrollbar relative flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
