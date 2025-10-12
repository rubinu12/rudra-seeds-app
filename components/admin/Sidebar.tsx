// src/components/admin/Sidebar.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const placeholders = Array.from({ length: 3 }); // For Wednesday start
    const today = 10;

    return (
        <div className="bg-surface/70 backdrop-blur-md border border-outline/30 rounded-m3-xlarge p-4 h-full">
            <div className="px-2">
                <p className="text-on-surface-variant text-sm">Select date</p>
                <p className="text-on-surface text-2xl font-medium">Fri, October 10</p>
                
                <div className="flex items-center justify-center my-4 gap-2 text-sm">
                    <a href="#" className="btn px-4 py-2 rounded-m3-full bg-gradient-to-br from-secondary to-tertiary text-on-primary font-medium shadow-m3-active">Calendar</a>
                    <a href="#" className="btn px-4 py-2 text-on-surface-variant font-medium">To-Do</a>
                    <a href="#" className="btn px-4 py-2 text-on-surface-variant font-medium">Expenses</a>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-medium text-on-surface">October 2025</h3>
                    <div className="flex space-x-2 text-on-surface-variant">
                        <button className="btn"><ChevronLeft /></button>
                        <button className="btn"><ChevronRight /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 text-center text-sm">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={`${day}-${index}`} className="text-secondary font-medium h-10 flex justify-center items-center">{day}</div>
                    ))}
                    {placeholders.map((_, i) => <div key={`ph-${i}`}></div>)}
                    {days.map(day => (
                        <div key={day} className="h-10 flex justify-center items-center">
                            {day === today ? (
                                <span className="bg-primary text-on-primary w-8 h-8 flex items-center justify-center rounded-full">{day}</span>
                            ) : (
                                <span>{day}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}