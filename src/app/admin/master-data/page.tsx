import React from 'react';
import MasterReportGrid from '@/src/components/admin/reports/MasterReportGrid';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Master Data | Rudra Seeds ERP',
    description: 'Explore, filter, and export master data records.',
};

export default function MasterDataPage() {
    return (
        <div className="p-4 md:p-6 w-full h-full flex flex-col bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reports & Master Data</h1>
                <p className="text-gray-500 text-sm mt-1">
                    View, filter, and export active crop cycles, farmer details, and lot numbers. Use the column headers to search or hide columns before downloading.
                </p>
            </div>
            
            {/* Grid Container */}
            <div className="flex-grow min-h-[600px]">
                <MasterReportGrid />
            </div>
        </div>
    );
}