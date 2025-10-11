import { Bell, ChevronDown, Menu, User, Wheat } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/70 px-4 backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-900/70 md:px-6">
      
      {/* --- Left Side --- */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button className="btn md:hidden">
          <Menu className="h-6 w-6" />
        </button>
        {/* Branding */}
        <div className="flex items-center gap-2">
          <Wheat className="h-7 w-7 text-green-600" />
          <span className="hidden text-xl font-bold text-gray-800 dark:text-white sm:block">
            RudraSeeds
          </span>
        </div>
      </div>

      {/* --- Center Navigation (Desktop Only) --- */}
      <div className="hidden items-center gap-2 rounded-lg border border-gray-300 p-1 dark:border-gray-600 md:flex">
        <button className="btn rounded-md bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          Sowing
        </button>
        <button className="btn px-4 py-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          Growing
        </button>
        <button className="btn px-4 py-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          Harvesting
        </button>
      </div>

      {/* --- Right Side --- */}
      <div className="flex items-center gap-4">
        <button className="btn rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="btn group flex cursor-pointer items-center gap-2">
          <User className="h-9 w-9 rounded-full bg-gray-200 p-2 text-gray-600 dark:bg-gray-700 dark:text-gray-300" />
          <div className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-semibold">Admin</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
}