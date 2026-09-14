import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { SyncMode, InventoryItem, ReconcileSummary } from './types/stockSync';
import { reconcileModeA, reconcileModeB } from './engine/stockSync';
import { Upload, ArrowRight, Download, CheckCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [mode, setMode] = useState<SyncMode>('MODE_A_SALES');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Raw file rows
  const [file1Name, setFile1Name] = useState<string>('');
  const [file1Rows, setFile1Rows] = useState<any[]>([]);

  const [file2Name, setFile2Name] = useState<string>('');
  const [file2Rows, setFile2Rows] = useState<any[]>([]);

  const [file3Name, setFile3Name] = useState<string>('');
  const [file3Rows, setFile3Rows] = useState<any[]>([]);

  // Results
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<ReconcileSummary | null>(null);

  const parseFile = (file: File, callback: (rows: any[], name: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
        callback(data, file.name);
      } catch (err) {
        alert(`Failed to parse ${file.name}. Please upload a valid CSV/XLSX.`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const runReconciliation = () => {
    if (file1Rows.length === 0 || file2Rows.length === 0) {
      alert('Please upload both required inventory spreadsheets.');
      return;
    }

    if (mode === 'MODE_A_SALES') {
      const res = reconcileModeA(file1Rows, file2Rows, file3Rows);
      setItems(res.items);
      setSummary(res.summary);
    } else {
      const res = reconcileModeB(file1Rows, file2Rows);
      setItems(res.items);
      setSummary(res.summary);
    }
    setStep(2);
  };

  const handleExport = (type: 'corrected' | 'discrepancy', format: 'csv' | 'xlsx') => {
    let exportData: any[] = [];

    if (type === 'corrected') {
      exportData = items.map(i => ({
        'SKU': i.sku,
        'Product Name': i.productName,
        'Opening / System Stock': i.openingStock,
        'Sold Qty': i.soldQuantity,
        'Returned Qty': i.returnedQuantity,
        'Physical Stock': i.physicalStock,
        'Final Corrected Stock': mode === 'MODE_A_SALES' ? i.expectedStock : i.physicalStock,
        'Status': i.status,
      }));
    } else {
      exportData = items.filter(i => i.status !== 'MATCH').map(i => ({
        'SKU': i.sku,
        'Product Name': i.productName,
        'System Stock': i.systemStock,
        'Physical / Expected Stock': mode === 'MODE_A_SALES' ? i.expectedStock : i.physicalStock,
        'Difference': i.difference,
        'Status': i.status,
        'Notes': i.notes.join('; '),
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'corrected' ? 'Reconciled Inventory' : 'Discrepancy Report');

    const filename = `${type === 'corrected' ? 'Reconciled_Inventory' : 'Inventory_Discrepancies'}.${format}`;
    if (format === 'csv') {
      XLSX.writeFile(wb, filename, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 flex flex-col font-sans">
      <Header toolName="StockSync" tagline="Reconcile Inventory & Stock Differences" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Mode Selector */}
        {step === 1 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Choose Reconciliation Mode</h2>
              <p className="text-xs text-gray-400">Select how you want to calculate and verify your inventory stock.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('MODE_A_SALES')}
                className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  mode === 'MODE_A_SALES'
                    ? 'bg-[#2563EB]/10 border-[#2563EB] shadow-lg shadow-[#2563EB]/20'
                    : 'bg-[#151518] border-[#24242A] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-[#2563EB] uppercase">Mode A</span>
                  {mode === 'MODE_A_SALES' && <CheckCircle className="w-5 h-5 text-[#2563EB]" />}
                </div>
                <h3 className="text-lg font-bold text-white">Opening + Sales / Restocks</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Upload opening stock file and sales/orders sheet. Calculate expected stock = Opening - Sold + Restocked.
                </p>
              </button>

              <button
                onClick={() => setMode('MODE_B_PHYSICAL')}
                className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  mode === 'MODE_B_PHYSICAL'
                    ? 'bg-[#2563EB]/10 border-[#2563EB] shadow-lg shadow-[#2563EB]/20'
                    : 'bg-[#151518] border-[#24242A] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-[#2563EB] uppercase">Mode B</span>
                  {mode === 'MODE_B_PHYSICAL' && <CheckCircle className="w-5 h-5 text-[#2563EB]" />}
                </div>
                <h3 className="text-lg font-bold text-white">System vs Physical Audit</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Upload system inventory file and physical warehouse count sheet. Compare system vs actual stock directly.
                </p>
              </button>
            </div>

            {/* Upload Cards */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 space-y-6 shadow-2xl">
              <h3 className="text-sm font-bold text-white border-b border-[#24242A] pb-3">Upload Required Spreadsheets</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File 1 */}
                <div className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">
                    1. {mode === 'MODE_A_SALES' ? 'Opening Inventory' : 'System Inventory'} (CSV/XLSX)
                  </label>
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#24242A] hover:bg-gray-700 text-xs font-bold text-white cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#2563EB]" />
                    <span>{file1Name || 'Upload Inventory File'}</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) parseFile(f, (rows, name) => { setFile1Rows(rows); setFile1Name(name); });
                      }}
                      className="hidden"
                    />
                  </label>
                  {file1Rows.length > 0 && <p className="text-[11px] text-[#00F5A0] font-mono">{file1Rows.length} rows loaded</p>}
                </div>

                {/* File 2 */}
                <div className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">
                    2. {mode === 'MODE_A_SALES' ? 'Sales / Orders File' : 'Physical Count Audit'} (CSV/XLSX)
                  </label>
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#24242A] hover:bg-gray-700 text-xs font-bold text-white cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#2563EB]" />
                    <span>{file2Name || (mode === 'MODE_A_SALES' ? 'Upload Sales File' : 'Upload Physical Audit')}</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) parseFile(f, (rows, name) => { setFile2Rows(rows); setFile2Name(name); });
                      }}
                      className="hidden"
                    />
                  </label>
                  {file2Rows.length > 0 && <p className="text-[11px] text-[#00F5A0] font-mono">{file2Rows.length} rows loaded</p>}
                </div>
              </div>

              {/* Optional File 3 for Mode A */}
              {mode === 'MODE_A_SALES' && (
                <div className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">
                    3. Returns / Restocks File (Optional)
                  </label>
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#24242A] hover:bg-gray-700 text-xs font-bold text-white cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#2563EB]" />
                    <span>{file3Name || 'Upload Restocks (Optional)'}</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) parseFile(f, (rows, name) => { setFile3Rows(rows); setFile3Name(name); });
                      }}
                      className="hidden"
                    />
                  </label>
                  {file3Rows.length > 0 && <p className="text-[11px] text-[#00F5A0] font-mono">{file3Rows.length} rows loaded</p>}
                </div>
              )}

              <button
                onClick={runReconciliation}
                disabled={file1Rows.length === 0 || file2Rows.length === 0}
                className="w-full py-4 rounded-2xl bg-[#2563EB] hover:bg-[#3b82f6] disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-[#2563EB]/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Reconcile Inventory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DISCREPANCY & RECONCILIATION RESULTS */}
        {step === 2 && summary && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#151518] border border-[#24242A] p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-white font-mono">{summary.totalSkusEvaluated}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Total SKUs Evaluated</p>
              </div>
              <div className="bg-[#151518] border border-[#00F5A0]/30 p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-[#00F5A0] font-mono">{summary.matchingSkusCount}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Perfect Stock Matches</p>
              </div>
              <div className="bg-[#151518] border border-amber-500/30 p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">{summary.discrepancyCount}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Actionable Discrepancies</p>
              </div>
            </div>

            {/* Discrepancies List */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#24242A] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Actionable Stock Differences</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Clear breakdown of stock variances requiring adjustment.</p>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  {summary.discrepancyCount} Discrepancies
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {items.filter(i => i.status !== 'MATCH').map(i => (
                  <div key={i.sku} className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{i.sku}</span>
                        <span className="text-xs text-gray-400">({i.productName})</span>
                      </div>
                      {i.notes.length > 0 && (
                        <p className="text-[11px] text-amber-300 mt-1">{i.notes.join('; ')}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                      <div>
                        <span className="text-gray-400 block text-[10px]">SYSTEM</span>
                        <span className="text-white font-bold">{i.systemStock || i.openingStock}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">{mode === 'MODE_A_SALES' ? 'EXPECTED' : 'PHYSICAL'}</span>
                        <span className="text-white font-bold">{mode === 'MODE_A_SALES' ? i.expectedStock : i.physicalStock}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 block text-[10px]">VARIANCE</span>
                        <span className={`font-extrabold ${i.difference < 0 ? 'text-red-400' : 'text-[#00F5A0]'}`}>
                          {i.difference > 0 ? `+${i.difference}` : i.difference}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Bar */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-[#24242A] text-gray-300 hover:text-white text-xs font-bold"
              >
                Back to Upload
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleExport('corrected', 'csv')}
                  className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#3b82f6] text-white font-bold text-xs shadow-lg shadow-[#2563EB]/20 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Corrected Stock CSV</span>
                </button>
                <button
                  onClick={() => handleExport('discrepancy', 'xlsx')}
                  className="px-5 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#34f8b2] text-gray-950 font-bold text-xs shadow-lg shadow-[#00F5A0]/20 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Discrepancy XLSX</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
