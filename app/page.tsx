// Using some simple icons from a popular library
import { ChevronDown, Calendar, Search, PlusCircle } from 'lucide-react';

export default function DashboardPrototype() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* ===== HEADER / NAVBAR ===== */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-blue-600">RudraSeeds</span>
        </div>
        <div className="flex items-center gap-6 rounded-md border border-gray-300 dark:border-gray-600 p-2">
          <button className="font-semibold text-gray-700 dark:text-gray-300">Sowing</button>
          <button className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Growing</button>
          <button className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Harvesting</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Year:</span>
          <button className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1.5">
            2025 <ChevronDown size={16} />
          </button>
        </div>
      </header>

      {/* ===== MAIN DASHBOARD CONTENT ===== */}
      <main className="p-6 space-y-6">
        
        {/* --- Row 1: Metrics & Admin Hub --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Metric Card */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Farmers</h3>
                <p className="mt-2 text-3xl font-bold">45</p>
              </div>
              {/* Metric Card */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Area (Vigha)</h3>
                <p className="mt-2 text-3xl font-bold">112</p>
              </div>
              {/* Metric Card */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Seed Disbursed (kg)</h3>
                <p className="mt-2 text-3xl font-bold">5,600</p>
              </div>
              {/* Metric Card */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Active Cycles</h3>
                <p className="mt-2 text-3xl font-bold">52</p>
              </div>
            </div>
          </div>
          {/* Admin Hub */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
            <div className="flex items-center gap-4 border-b pb-3 mb-3">
               <button className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-3">To-Do List</button>
               <button className="text-gray-500">Expenses</button>
               <button className="text-gray-500"><Calendar size={20}/></button>
            </div>
            <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><input type="checkbox" className="rounded"/> Follow up with ABC Seeds</li>
                <li className="flex items-center gap-2"><input type="checkbox" className="rounded"/> Schedule field visits for North region</li>
                <li className="flex items-center gap-2"><input type="checkbox" className="rounded" checked readOnly/> Pay transporter bills</li>
            </ul>
          </div>
        </div>

        {/* --- Row 2: Filters --- */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4 text-sm">
            <span className="font-semibold">Filters:</span>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-md"><span>Village</span> <ChevronDown size={16}/></div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-md"><span>Seed Variety</span> <ChevronDown size={16}/></div>
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type="text" placeholder="Search by Farmer Name..." className="w-full bg-gray-100 dark:bg-gray-700 pl-10 p-2 rounded-md"/>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700">
              <PlusCircle size={18} />
              Add Crop Cycle
            </button>
        </div>

        {/* --- Row 3: Data Table --- */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Farmer Name</th>
                <th scope="col" className="px-6 py-3">Village</th>
                <th scope="col" className="px-6 py-3">Seed Variety</th>
                <th scope="col" className="px-6 py-3">Area (Vigha)</th>
                <th scope="col" className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium">Ramesh Patel</td>
                <td className="px-6 py-4">Jamnagar</td>
                <td className="px-6 py-4">Lokwan</td>
                <td className="px-6 py-4">5.0</td>
                <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Growing</span></td>
              </tr>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium">Suresh Singh</td>
                <td className="px-6 py-4">Rajkot</td>
                <td className="px-6 py-4">HD2967</td>
                <td className="px-6 py-4">2.5</td>
                <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Growing</span></td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium">Vikas Sharma</td>
                <td className="px-6 py-4">Amreli</td>
                <td className="px-6 py-4">Lokwan</td>
                <td className="px-6 py-4">10.0</td>
                <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">Pending Visit</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}