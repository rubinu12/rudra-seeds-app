import { Home, PlusCircle, Search, Calendar } from 'lucide-react';

export default function BottomNavBar() {
  return (
    // The 'md:hidden' class is the key here. It hides this component on screens
    // that are medium size or larger, making it mobile-only.
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200/80 bg-white/80 backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-900/80 md:hidden">
      <div className="flex h-16 items-center justify-around">
        <button className="btn flex flex-col items-center gap-1 text-blue-600">
          <Home size={24} />
          <span className="text-xs font-semibold">Home</span>
        </button>
        <button className="btn flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <Calendar size={24} />
          <span className="text-xs">Seasons</span>
        </button>
        {/* The central "Add" button is styled to be more prominent */}
        <button className="btn flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">
          <PlusCircle size={32} />
        </button>
        <button className="btn flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <Search size={24} />
          <span className="text-xs">Search</span>
        </button>
      </div>
    </div>
  );
}