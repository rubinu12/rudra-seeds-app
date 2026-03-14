"use client";

import React, { useState, useEffect } from 'react';
import { getHarvestProgress } from '@/src/app/admin/actions/progress-actions';
import SignatureModal from '../SignatureModal';

export default function HarvestProgressStrip({ year }: { year: number }) {
    const [progress, setProgress] = useState({ totalArea: 0, untouchedArea: 0, workDoneArea: 0, progressPercentage: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCompletedMode, setIsCompletedMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getHarvestProgress(year).then(data => {
            setProgress(data);
            setIsLoading(false);
            
            // Auto-trigger the "Thank You" modal if 100% and not yet shown this session
            if (data.totalArea > 0 && data.progressPercentage === 100) {
                const hasSeen = sessionStorage.getItem(`completed_modal_shown_${year}`);
                if (!hasSeen) {
                    setIsCompletedMode(true);
                    setIsModalOpen(true);
                    sessionStorage.setItem(`completed_modal_shown_${year}`, 'true');
                }
            }
        });
    }, [year]);

    const handleDoubleClick = () => {
        setIsCompletedMode(false);
        setIsModalOpen(true);
    };

    if (isLoading || progress.totalArea === 0) return null; 

    return (
        <>
            {/* FIX: Using marginLeft and marginRight with calc(-50vw + 50%) 
              forces the element to perfectly bleed to the viewport edges 
              WITHOUT causing the white scrollbar gap! 
            */}
            <div 
                className="relative z-40 h-1.5 -mt-8 mb-8 flex justify-center group cursor-crosshair bg-slate-200 shadow-inner"
                style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}
                onDoubleClick={handleDoubleClick}
            >
                {/* The Active Progress Line */}
                <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progress.progressPercentage}%` }}
                >
                    {/* Glowing head */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_2px_rgba(16,185,129,0.7)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* FIX: Solid, Opaque, Light-Themed Tooltip for maximum readability */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] flex items-center gap-4 whitespace-nowrap ring-1 ring-slate-900/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Harvesting Progress</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-emerald-600 text-xl leading-none">
                                    {progress.progressPercentage}%
                                </span>
                                <span className="w-px h-5 bg-slate-200 mx-2"></span>
                                <span className="font-bold text-slate-800 text-base">
                                    {progress.workDoneArea} <span className="text-slate-500 font-medium">Vigha Done</span>
                                </span>
                                <span className="text-slate-400 text-xs font-bold uppercase ml-1">
                                    / {progress.totalArea} Total
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SignatureModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                isCompleted={isCompletedMode} 
            />
        </>
    );
}