// src/components/admin/reports/HarvestMasterGrid.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi, ModuleRegistry, AllCommunityModule, ValueFormatterParams, CellValueChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css'; 

import { getHarvestMasterReport, updateHarvestInlineField, HarvestMasterRow } from '@/src/app/admin/actions/harvest-master-actions';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast, { Toaster } from 'react-hot-toast'; // IMPORTED TOASTER HERE

ModuleRegistry.registerModules([AllCommunityModule]);

export default function HarvestMasterGrid() {
    const [rowData, setRowData] = useState<HarvestMasterRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const gridApiRef = useRef<GridApi | null>(null);
    
    // --- THE CIRCUIT BREAKER ---
    // This physically stops AG Grid from triggering an infinite edit loop when we revert a failed save
    const isReverting = useRef(false);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getHarvestMasterReport();
                setRowData(data);
            } catch (error) {
                toast.error("Failed to load ledger data.");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        gridApiRef.current = params.api;
    }, []);

    // --- HANDLE INLINE EDITING ---
    const handleCellValueChanged = async (event: CellValueChangedEvent) => {
        // 1. Circuit Breaker: If we are currently undoing a failed save, DO NOT trigger another save!
        if (isReverting.current) return;
        
        // 2. Ignore if the user clicked the cell but didn't actually change the text
        if (event.oldValue === event.newValue) return;

        // 3. Grab the explicit DB ID we added to the Server Action
        const cycleId = event.data.cycleId; 
        const field = event.colDef.field;
        const newValue = event.newValue;

        if (!field || !cycleId) return;

        const loadingToast = toast.loading('Syncing to Database...');
        
        try {
            const result = await updateHarvestInlineField(cycleId, field, newValue);
            if (result.success) {
                toast.success('Database updated successfully!', { id: loadingToast, duration: 3000 });
            } else {
                toast.error(result.message || 'Update failed.', { id: loadingToast, duration: 4000 });
                
                // SAFELY REVERT THE CELL ON FAILURE
                isReverting.current = true; // Engage Circuit Breaker
                event.node.setDataValue(field, event.oldValue);
                setTimeout(() => { isReverting.current = false; }, 50); // Disengage after UI updates
            }
        } catch (error) {
            toast.error('Network error. Edit reverted.', { id: loadingToast });
            
            // SAFELY REVERT THE CELL ON CRASH
            isReverting.current = true;
            event.node.setDataValue(field, event.oldValue);
            setTimeout(() => { isReverting.current = false; }, 50);
        }
    };

    const currencyFormatter = (params: ValueFormatterParams) => {
        return params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0';
    };

    const editableCellStyle = { backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', cursor: 'text' };

    const columnDefs: ColDef[] = [
        { headerName: 'Bill No.', field: 'billNo', filter: 'agTextColumnFilter', sortable: true, minWidth: 120 },
        { headerName: 'Status', field: 'status', filter: 'agTextColumnFilter', sortable: true, minWidth: 120,
          cellStyle: (params) => {
            if (params.value?.toLowerCase() === 'paid') return { color: '#059669', fontWeight: 'bold' };
            if (params.value?.toLowerCase() === 'cleared') return { color: '#4f46e5', fontWeight: 'bold' };
            return { color: '#d97706', fontWeight: 'bold' };
          }
        },
        { headerName: 'Farmer Name', field: 'farmerName', filter: 'agTextColumnFilter', sortable: true, minWidth: 200 },
        
        // Editable Fields
        { headerName: 'Mobile Number ✎', field: 'mobileNumber', filter: 'agTextColumnFilter', sortable: true, minWidth: 150, editable: true, cellStyle: editableCellStyle },
        { headerName: 'Bank Acc Name ✎', field: 'bankAccountName', filter: 'agTextColumnFilter', sortable: true, minWidth: 200, editable: true, cellStyle: editableCellStyle },
        { headerName: 'Lot No(s) ✎', field: 'lotNos', filter: 'agTextColumnFilter', sortable: true, minWidth: 150, editable: true, cellStyle: editableCellStyle },
        
        { headerName: 'Variety', field: 'variety', filter: 'agTextColumnFilter', sortable: true, minWidth: 150 },
        { headerName: 'Bags', field: 'bags', filter: 'agNumberColumnFilter', sortable: true, minWidth: 100 },
        { headerName: 'Weight (Man)', field: 'weightInMan', filter: 'agNumberColumnFilter', sortable: true, minWidth: 130 },
        { headerName: 'Rate (/Man)', field: 'purchaseRate', filter: 'agNumberColumnFilter', sortable: true, minWidth: 130, valueFormatter: currencyFormatter },
        { headerName: 'Amount', field: 'amount', filter: 'agNumberColumnFilter', sortable: true, minWidth: 150, valueFormatter: currencyFormatter },
        { headerName: 'Payee Name(s)', field: 'chequeName', filter: 'agTextColumnFilter', sortable: true, minWidth: 200 },
        
        // Editable Cheque Fields
        { headerName: 'Cheque No(s) ✎', field: 'chequeNumbers', filter: 'agTextColumnFilter', sortable: true, minWidth: 160, editable: true, cellStyle: editableCellStyle },
        
        { headerName: 'Due Date(s)', field: 'chequeDueDates', filter: 'agTextColumnFilter', sortable: true, minWidth: 150 }
    ];

    const defaultColDef = {
        resizable: true,
        floatingFilter: true,
    };

    const exportToExcel = async () => {
        if (!gridApiRef.current) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Harvest Ledger');

        const visibleColumns = gridApiRef.current.getAllDisplayedColumns();
        
        worksheet.columns = visibleColumns.map(col => ({
            header: col.getColDef().headerName || col.getColId(),
            key: col.getColId(),
            width: 20 
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
        saveAs(blob, `Harvest_Master_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            
            {/* THE FIX: TOASTER ADDED HERE TO MAKE NOTIFICATIONS VISIBLE */}
            <Toaster position="top-center" reverseOrder={false} />

            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">Harvest & Financial Ledger Grid</h2>
                <div className="flex space-x-3">
                    <button 
                        onClick={exportToExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center font-bold text-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="ag-theme-alpine w-full h-full flex-1 min-h-[600px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                        Loading Ledger Data...
                    </div>
                ) : (
                    <AgGridReact
                        theme="legacy"
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        onGridReady={onGridReady}
                        onCellValueChanged={handleCellValueChanged}
                        rowSelection="multiple"
                        animateRows={true}
                        pagination={true}
                        paginationPageSize={100}
                        stopEditingWhenCellsLoseFocus={true} 
                    />
                )}
            </div>
        </div>
    );
}