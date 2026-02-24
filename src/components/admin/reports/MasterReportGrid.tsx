'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css'; 

import { fetchMasterReportData } from '@/src/app/admin/actions/master-data-actions';
import { MasterReportRow } from '@/src/lib/definitions';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function MasterReportGrid() {
    const [rowData, setRowData] = useState<MasterReportRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const gridApiRef = useRef<GridApi | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await fetchMasterReportData();
                setRowData(data);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        gridApiRef.current = params.api;
        // Notice: We REMOVED sizeColumnsToFit() so the columns are allowed to be wide!
    }, []);

    const columnDefs: ColDef[] = [
        // We give specific minWidths to ensure text is never cut off
        { headerName: 'Farmer Name', field: 'farmer_name', filter: 'agTextColumnFilter', sortable: true, minWidth: 200 },
        { headerName: 'Mobile Number', field: 'mobile_number', filter: 'agTextColumnFilter', sortable: true, minWidth: 150 },
        { headerName: 'Bank Account Details', field: 'bank_account_details', filter: 'agTextColumnFilter', sortable: true, minWidth: 350 },
        { headerName: 'Area (Vigha)', field: 'area_in_vigha', filter: 'agNumberColumnFilter', sortable: true, minWidth: 120 },
        { headerName: 'Lot No.', field: 'lot_no', filter: 'agTextColumnFilter', sortable: true, minWidth: 150 },
        { headerName: 'Seed Variety', field: 'seed_variety', filter: 'agTextColumnFilter', sortable: true, minWidth: 150 },
        { headerName: 'Village', field: 'village_name', filter: 'agTextColumnFilter', sortable: true, minWidth: 150 },
        
        { headerName: 'Bags Collected (Write-in)', field: 'dummy_bags', hide: true, sortable: false, filter: false, minWidth: 200 }
    ];

    const defaultColDef = {
        resizable: true,
        floatingFilter: true, // This adds the search boxes directly under headers
    };

    const exportToExcel = async () => {
        if (!gridApiRef.current) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Master Report');

        const visibleColumns = gridApiRef.current.getAllDisplayedColumns();
        
        worksheet.columns = visibleColumns.map(col => ({
            header: col.getColDef().headerName || col.getColId(),
            key: col.getColId(),
            width: 25 // Made excel columns wider by default too
        }));

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        gridApiRef.current.forEachNodeAfterFilterAndSort((node) => {
            if (node.data) {
                const rowObj: any = {};
                visibleColumns.forEach(col => {
                    const colId = col.getColId();
                    rowObj[colId] = node.data[colId] || ''; 
                });
                worksheet.addRow(rowObj);
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Rudra_Seeds_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="flex flex-col h-[80vh] w-full p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Master Data Explorer</h2>
                <div className="flex space-x-3">
                    <button 
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download Excel
                    </button>
                </div>
            </div>

            <div className="ag-theme-alpine w-full h-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">Loading data...</div>
                ) : (
                    <AgGridReact
                        theme="legacy" /* <--- THIS FIXES ERROR #239 */
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        onGridReady={onGridReady}
                        rowSelection="multiple"
                        animateRows={true}
                        pagination={true}
                        paginationPageSize={50}
                    />
                )}
            </div>
        </div>
    );
}