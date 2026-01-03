"use client";

import { useState } from "react";
import { 
  ClipboardList, Tag, CheckCircle2, Truck, Wallet, FileEdit, 
  ArrowRightCircle, Package, ThumbsUp, Scale, ClipboardCheck,
  AlertTriangle, Timer, IndianRupee, ChevronLeft, ChevronRight, ListChecks,
  Calendar as CalendarIcon, CheckSquare, TrendingUp, Plus
} from "lucide-react";
import CriticalAlertsCard from "@/components/admin/harvesting/CriticalAlertsCard";

// ==================== 1. LEFT SIDE: QUICK ACTIONS (WelcomeHeader) ====================

const QuickActions = () => {
  const actions = [
    { label: "Sample Entry", icon: ClipboardList, color: "bg-purple-100 text-purple-700" },
    { label: "Set Temp Price", icon: Tag, color: "bg-amber-100 text-amber-700" },
    { label: "Verify Price", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
    { label: "Edit Cycle", icon: FileEdit, color: "bg-rose-100 text-rose-700" },
    { label: "Generate Bill", icon: Truck, color: "bg-blue-100 text-blue-700" },
    { label: "Process Pay", icon: Wallet, color: "bg-slate-800 text-white" },
    { label: "Finance", icon: IndianRupee, color: "bg-teal-100 text-teal-700" },
  ];

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Good Morning, Admin</h2>
          <p className="text-slate-500 font-medium">Here's what's happening in your harvest today.</p>
        </div>
        <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
          Quick Actions
        </span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {actions.map((action, i) => (
          <button 
            key={i}
            className="flex flex-col items-center gap-3 min-w-[100px] group transition-transform active:scale-95"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all ${action.color}`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-600 text-center max-w-[80px] leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ==================== 2. LEFT SIDE: DATA CARDS ====================

const PipelineCard = () => {
  const [view, setView] = useState<'total' | '24h'>('total');
  // Mock Data
  const stats = view === 'total' 
    ? { harvested: 1240, sampled: 850, priced: 620, weighed: 450 } 
    : { harvested: 120, sampled: 45, priced: 30, weighed: 15 };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 relative">
       <div className="flex justify-between items-start mb-6">
         <div>
           <h3 className="text-lg font-bold text-slate-800">Pipeline Status</h3>
           <p className="text-sm text-slate-400 font-medium">{view === 'total' ? 'Season Total' : 'Last 24 Hours'}</p>
         </div>
         <button onClick={() => setView(view === 'total' ? '24h' : 'total')} className="text-slate-400 hover:text-purple-600 transition-colors">
           <ArrowRightCircle className="w-6 h-6" />
         </button>
       </div>
       <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <StatItem icon={ThumbsUp} label="Harvested" value={stats.harvested} color="text-blue-500" />
          <StatItem icon={ClipboardCheck} label="Sampled" value={stats.sampled} color="text-purple-500" />
          <StatItem icon={Package} label="Priced" value={stats.priced} color="text-amber-500" />
          <StatItem icon={Scale} label="Weighed" value={stats.weighed} color="text-teal-500" />
       </div>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center gap-3">
    <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.5} />
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
    </div>
  </div>
);

const AlertsCard = () => (
  <div className="bg-red-50 rounded-[32px] p-6 border border-red-100">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-lg font-bold text-red-900">Critical Alerts</h3>
        <p className="text-sm text-red-700/70 font-medium">Immediate attention needed</p>
      </div>
      <AlertTriangle className="w-6 h-6 text-red-600" />
    </div>
    <div className="space-y-4">
       <AlertItem icon={Timer} count={12} label="Overdue Weighing (>12 Days)" />
       <AlertItem icon={Package} count={5} label="Weighed but Not Loaded" />
    </div>
  </div>
);

const AlertItem = ({ icon: Icon, count, label }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors cursor-pointer">
    <Icon className="w-6 h-6 text-red-600" />
    <div>
       <p className="text-xl font-bold text-slate-900">{count}</p>
       <p className="text-xs font-bold text-red-600 uppercase">{label}</p>
    </div>
  </div>
);

const FinanceCard = () => {
  const [tab, setTab] = useState('payments');
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
       <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-bold text-slate-800">Financial Overview</h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
             <button onClick={() => setTab('payments')} className={`px-3 py-1 rounded-md text-xs font-bold ${tab === 'payments' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Pay</button>
             <button onClick={() => setTab('cheques')} className={`px-3 py-1 rounded-md text-xs font-bold ${tab === 'cheques' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Chq</button>
          </div>
       </div>
       <div className="space-y-4">
          {tab === 'payments' ? (
             <>
                <FinanceItem label="Pending Final Pay" value={42} />
                <FinanceItem label="Payment Given" value={1205} />
             </>
          ) : (
             <>
                <FinanceItem label="Cheques Due Today" value={8} />
                <FinanceItem label="Amount Due" value="₹ 4.5 L" icon={IndianRupee} />
             </>
          )}
       </div>
    </div>
  );
};

const FinanceItem = ({ label, value, icon: Icon }: any) => (
  <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
     <span className="text-sm font-medium text-slate-500">{label}</span>
     <div className="flex items-center gap-1">
        {Icon && <Icon className="w-4 h-4 text-slate-800" />}
        <span className="text-lg font-bold text-slate-800">{value}</span>
     </div>
  </div>
);

const ShipmentCard = () => (
  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
     <div className="flex justify-between items-start mb-2">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Shipments</h3>
           <p className="text-sm text-slate-400 font-medium">Summary</p>
        </div>
        <Truck className="w-6 h-6 text-slate-300" />
     </div>
     
     <div className="bg-slate-50 rounded-2xl p-4 text-center mb-4 relative">
        <button className="absolute left-2 top-1/2 -translate-y-1/2"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
        <p className="font-bold text-slate-700">Raghuvir Cotex</p>
        <div className="flex justify-center gap-4 mt-2 text-xs">
           <span>Sent: <b>₹ 12L</b></span>
           <span>Recv: <b className="text-green-600">₹ 0</b></span>
        </div>
        <button className="absolute right-2 top-1/2 -translate-y-1/2"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
     </div>

     <button className="w-full py-3 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors">
        <ListChecks className="w-4 h-4" /> Verify Cheques (3)
     </button>
  </div>
);


// ==================== 3. RIGHT SIDE: THE SIDEBAR (Calendar/Todo) ====================

const RightSidebar = () => {
  return (
    <div className="space-y-6 h-full">
       
       {/* CALENDAR WIDGET */}
       <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" /> Schedule
             </h3>
             <button className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                <Plus className="w-4 h-4" />
             </button>
          </div>
          
          {/* Mini Calendar Visual */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
             <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-3">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
             </div>
             <div className="grid grid-cols-7 gap-y-3 text-center text-sm font-medium text-slate-600">
                <span className="opacity-30">29</span><span className="opacity-30">30</span>
                <span>1</span><span>2</span>
                <span className="bg-purple-600 text-white rounded-lg shadow-md">3</span>
                <span>4</span><span>5</span>
             </div>
          </div>

          {/* Todo List */}
          <div className="space-y-4">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">To-Do List</p>
             {[
               { txt: "Call Logistics", done: false },
               { txt: "Approve Samples", done: true },
               { txt: "Check Inventory", done: false }
             ].map((task, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${task.done ? "bg-green-500 border-green-500 text-white" : "border-slate-300"}`}>
                      {task.done && <CheckSquare className="w-3 h-3" />}
                   </div>
                   <span className={`text-sm font-medium ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{task.txt}</span>
                </div>
             ))}
          </div>
       </div>

       {/* EXPENSE WIDGET */}
       <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Expenses</h3>
                <p className="text-xs text-slate-400">Office & Misc</p>
             </div>
             <button className="p-2 bg-white/20 rounded-xl"><Plus className="w-4 h-4" /></button>
          </div>
          
          <div className="space-y-3 relative z-10">
             <div className="flex justify-between text-sm bg-white/10 p-3 rounded-xl">
                <span>Tea / Snacks</span>
                <span className="font-bold">₹ 450</span>
             </div>
             <div className="flex justify-between text-sm bg-white/10 p-3 rounded-xl">
                <span>Stationery</span>
                <span className="font-bold">₹ 1,200</span>
             </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end relative z-10">
             <span className="text-xs font-bold text-slate-400 uppercase">Total Today</span>
             <span className="text-2xl font-bold">₹ 1,650</span>
          </div>
       </div>

    </div>
  );
};


// ==================== MAIN VIEW LAYOUT ====================

export default function HarvestView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT COLUMN (2/3 Width) */}
      <div className="lg:col-span-2 space-y-8">
        <QuickActions />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <PipelineCard />
           <CriticalAlertsCard data={{
            pricedOver12DaysNotWeighed: 0,
            weighedNotLoaded: 0
          }} />
           <FinanceCard />
           <ShipmentCard />
        </div>
      </div>

      {/* RIGHT COLUMN (1/3 Width) - The Sidebar */}
      <div className="lg:col-span-1">
         <RightSidebar />
      </div>

    </div>
  );
}