'use server';

import { getMasterReportData } from '@/src/lib/admin-data';
import { MasterReportRow } from '@/src/lib/definitions';

export async function fetchMasterReportData(): Promise<MasterReportRow[]> {
    try {
        const data = await getMasterReportData();
        return data;
    } catch (error) {
        console.error("Error in fetchMasterReportData action:", error);
        throw new Error("Failed to fetch master report data");
    }
}