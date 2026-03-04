"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, LoaderCircle, ArrowRight, Phone, Printer, MapPin, Sprout, AlertCircle } from "lucide-react";
import { useDebounce } from "@/src/hooks/useDebounce";
import { searchGlobal, performGlobalAction, SearchResult } from "@/src/app/admin/actions/global-search";
import { toast } from "sonner";

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      searchGlobal(debouncedQuery).then((data) => {
        setResults(data);
        setLoading(false);
        setIsOpen(true);
      });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleAction = async (item: SearchResult) => {
    // 1. REPRINT: Direct Navigation
    if (item.actionType === 'REPRINT') {
        router.push(`/admin/payments/${item.id}/print-cheque`);
        setIsOpen(false);
        return;
    }

    // 2. API ACTION: Execute immediately
    if (item.actionType === 'API') {
        const res = await performGlobalAction(item.id, item.actionLabel!);
        if(res.success) {
            toast.success("Updated Successfully");
            setQuery(""); 
            router.refresh();
        } else {
            toast.error(res.message);
        }
        return;
    }

    // 3. MODAL ACTION: Navigate with URL Parameters to trigger modals
    if (item.actionType === 'MODAL') {
        if (item.actionLabel === 'Process Payment') {
            router.push(`/admin/payments/${item.id}/process`);
        } else if (item.actionLabel?.includes('Shipments')) {
            router.push(`/admin/shipments`);
        } else if (item.actionLabel === 'Enter Sample Data') {
            // If it's only harvested, force the status update FIRST
            if (item.status.toLowerCase() === 'harvested') {
                const res = await performGlobalAction(item.id, 'Force Sample Collected');
                if (!res.success) {
                    toast.error("Failed to prepare cycle for sampling.");
                    return; // Stop here if the database fails
                }
            }
            // Now safely open the modal (the cycle is now officially 'Sample Collected')
            router.push(`/admin/dashboard?modal=sample&cycleId=${item.id}`);
        // 👆 👆 👆 👆
        } else if (item.actionLabel === 'Set Temporary Price') {
            router.push(`/admin/dashboard?modal=temp-price&cycleId=${item.id}`);
        } else if (item.actionLabel === 'Verify Price') {
            router.push(`/admin/dashboard?modal=verify-price&cycleId=${item.id}`);
        } else {
            router.push(`/admin/dashboard`);
        }
        setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg hidden md:block">
      <div className="relative group">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setIsOpen(true); }}
          placeholder="Search Farmer, Mobile, or Lot No..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:shadow-sm outline-none transition-all placeholder:text-slate-400"
        />
        {loading && (
            <div className="absolute right-3 top-2.5">
                <LoaderCircle className="w-4 h-4 animate-spin text-slate-400" />
            </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top">
          <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-50">
            {results.map((item) => (
              <div key={item.id} className="p-3 hover:bg-slate-50 flex justify-between items-center group transition-colors">
                
                {/* Left: Info */}
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                        {item.meta.lot && (
                            <span className="text-[10px] font-mono bg-yellow-50 text-yellow-700 border border-yellow-100 px-1.5 rounded">
                                {item.meta.lot}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3" /> {item.subtitle}
                        </span>
                        <span className="flex items-center gap-1 truncate text-slate-400">
                            <Sprout className="w-3 h-3" /> {item.seed}
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Call Button */}
                    <a 
                        href={`tel:${item.meta.mobile}`}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={`Call: ${item.meta.mobile}`}
                    >
                        <Phone className="w-4 h-4" />
                    </a>

                    {/* Action Button */}
                    {item.actionType === 'NONE' ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded select-none flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {item.actionLabel}
                        </span>
                    ) : (
                        <button 
                            onClick={() => handleAction(item)}
                            className={`
                                text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95
                                ${item.actionType === 'REPRINT' 
                                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800'}
                            `}
                        >
                            {item.actionType === 'REPRINT' && <Printer className="w-3 h-3" />}
                            {item.actionLabel} 
                            {item.actionType !== 'REPRINT' && <ArrowRight className="w-3 h-3" />}
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 p-2 text-[10px] text-center text-slate-400 font-medium border-t border-slate-100">
            Search Results
          </div>
        </div>
      )}
    </div>
  );
}