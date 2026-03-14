"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Leaf, Code2, Terminal } from 'lucide-react';

// --- Custom Typing Animation Hook ---
const TypewriterText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
    const [visibleText, setVisibleText] = useState("");
    
    useEffect(() => {
        setVisibleText(""); // Reset on open
        let i = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                setVisibleText(text.substring(0, i + 1));
                i++;
                if (i >= text.length) clearInterval(interval);
            }, 120); // Typing speed
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay]);

    return (
        <span className="relative">
            {visibleText}
            <span className="animate-pulse text-teal-400 opacity-80 ml-1">_</span>
        </span>
    );
};

export default function SignatureModal({ 
    isOpen, 
    onClose, 
    isCompleted 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    isCompleted: boolean;
}) {
    // State to delay the fade-in of your personal name until the typing finishes
    const [showName, setShowName] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowName(false);
            // ROOT & RISE is 11 chars * 120ms = ~1300ms + 500ms delay. 
            // We reveal your name right after the typing finishes!
            const timer = setTimeout(() => setShowName(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden border border-slate-700/50 relative text-center">
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                
                {isCompleted ? (
                    <div className="p-10 space-y-6">
                        <div className="w-24 h-24 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(20,184,166,0.2)] animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 fill-mode-both">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-3">Season Complete!</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Congratulations! The harvesting pipeline for this year has successfully reached 100%. All registered crops have been processed.
                            </p>
                        </div>
                        <div className="pt-8 mt-2 border-t border-slate-800">
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4 flex items-center justify-center gap-2">
                                <Terminal className="w-4 h-4" /> Platform Engineered By
                            </p>
                            <div className="flex items-center justify-center gap-3 text-white h-10">
                                <Leaf className="w-6 h-6 text-teal-400 animate-pulse" />
                                <span className="text-2xl font-black tracking-[0.2em] font-mono">
                                    <TypewriterText text="ROOT & RISE" delay={500} />
                                </span>
                            </div>
                            {/* Your Signature Fade-in */}
                            <div className={`mt-4 transition-all duration-1000 transform ${showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                <p className="text-[11px] text-teal-500/80 font-mono tracking-widest uppercase">
                                    Lead Architect & Developer
                                </p>
                                <p className="text-sm text-slate-300 font-bold tracking-wide mt-1">
                                    Rubin Undhad
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-14 space-y-4">
                        <div className="w-20 h-20 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-700/50 shadow-inner">
                            <Code2 className="w-10 h-10" />
                        </div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2 mb-2">
                            <Terminal className="w-4 h-4" /> Architected & Engineered By
                        </p>
                        <div className="flex items-center justify-center gap-3 text-white py-2 h-12">
                            <Leaf className="w-7 h-7 text-teal-400 animate-pulse" />
                            <span className="text-3xl font-black tracking-[0.2em] font-mono">
                                <TypewriterText text="ROOT & RISE" delay={300} />
                            </span>
                        </div>
                        
                        {/* Your Signature Fade-in */}
                        <div className={`pt-4 transition-all duration-1000 transform ${showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                            <p className="text-xs text-teal-500/80 font-mono tracking-widest uppercase mb-1">
                                Lead Developer
                            </p>
                            <p className="text-base text-slate-300 font-bold tracking-widest">
                                RUBIN UNDHAD
                            </p>
                            <p className="text-[10px] text-slate-600 mt-8 font-mono uppercase tracking-widest">
                                Custom ERP Solutions • Built for RudraSeeds
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}