import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { FieldMapping, OrderRow, AttentionItem, CleaningSummary, StandardField } from './types/orderClean';
import { autoMapColumns, cleanOrderDataset } from './engine/orderClean';
import { Upload, CheckCircle2, AlertTriangle, Download, ArrowRight, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  
  const [cleanedRows, setCleanedRows] = useState<OrderRow[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [summary, setSummary] = useState<CleaningSummary | null>(null);
  
  const [exportColumns, setExportColumns] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
        
        if (data.length > 0) {
          const parsedHeaders = Object.keys(data[0]);
          setHeaders(parsedHeaders);
          setRawRows(data);
          const initialMappings = autoMapColumns(parsedHeaders);
          setMappings(initialMappings);
          setStep(2);
        }
      } catch (err) {
        alert('Failed to parse file. Please upload a valid CSV or XLSX spreadsheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (standardField: StandardField, mappedHeader: string) => {
    setMappings(prev => prev.map(m => m.standardField === standardField ? { ...m, mappedHeader: mappedHeader || null } : m));
  };

  const runCleaning = () => {
    const result = cleanOrderDataset(rawRows, mappings);
    setCleanedRows(result.cleanedRows);
    setAttentionItems(result.attentionItems);
    setSummary(result.summary);

    // Initial export columns
    const cols = ['Order ID', 'Customer Name', 'Phone', 'Email', 'Address Line 1', 'Address Line 2', 'City', 'State', 'PIN Code', 'Payment Method', 'SKU', 'Product Name', 'Quantity', 'Price'];
    setExportColumns(cols);

    setStep(3);
  };

  const resolveAttentionItem = (id: string, updatedValue: string) => {
    setAttentionItems(prev => prev.filter(item => item.id !== id));
    setCleanedRows(prev => prev.map(row => {
      const targetItem = attentionItems.find(i => i.id === id);
      if (targetItem && row._rowId === targetItem.rowId) {
        return { ...row, [targetItem.field]: updatedValue };
      }
      return row;
    }));
  };

  const handleDownload = (format: 'csv' | 'xlsx') => {
    if (cleanedRows.length === 0) return;

    // Filter output columns
    const exportData = cleanedRows.map(row => {
      const obj: Record<string, any> = {};
      exportColumns.forEach(col => {
        obj[col] = row[col] ?? '';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clean Orders');

    const baseName = fileName.replace(/\.[^/.]+$/, '');
    if (format === 'csv') {
      XLSX.writeFile(wb, `${baseName}_Clean.csv`, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, `${baseName}_Clean.xlsx`, { bookType: 'xlsx' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 flex flex-col font-sans">
      <Header toolName="OrderClean" tagline="Standardize & Fix Order Sheets" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-8 max-w-xl mx-auto border-b border-[#24242A] pb-4">
          <div className={`flex items-center gap-2 text-xs font-mono font-bold ${step >= 1 ? 'text-[#FF5722]' : 'text-gray-500'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">1</span>
            <span>Upload</span>
          </div>
          <div className={`h-2 flex-1 mx-2 rounded-full ${step >= 2 ? 'bg-[#FF5722]' : 'bg-[#24242A]'}`}></div>
          <div className={`flex items-center gap-2 text-xs font-mono font-bold ${step >= 2 ? 'text-[#FF5722]' : 'text-gray-500'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">2</span>
            <span>Map</span>
          </div>
          <div className={`h-2 flex-1 mx-2 rounded-full ${step >= 3 ? 'bg-[#FF5722]' : 'bg-[#24242A]'}`}></div>
          <div className={`flex items-center gap-2 text-xs font-mono font-bold ${step >= 3 ? 'text-[#FF5722]' : 'text-gray-500'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">3</span>
            <span>Clean & Review</span>
          </div>
          <div className={`h-2 flex-1 mx-2 rounded-full ${step >= 4 ? 'bg-[#FF5722]' : 'bg-[#24242A]'}`}></div>
          <div className={`flex items-center gap-2 text-xs font-mono font-bold ${step >= 4 ? 'text-[#00F5A0]' : 'text-gray-500'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">4</span>
            <span>Export</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/30 text-[#FF5722] flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Upload your messy order sheet</h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Accepts CSV, XLSX, or XLS files. We’ll auto-detect columns, normalize phone numbers, states, PIN codes, COD terms, and flag duplicates.
              </p>
            </div>

            <label className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#FF5722] hover:bg-[#ff6937] text-white font-bold text-sm shadow-xl shadow-[#FF5722]/20 cursor-pointer transition-all gap-2">
              <Upload className="w-4 h-4" />
              <span>Select Order File</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="pt-4 border-t border-[#24242A] text-xs text-gray-500 font-mono">
              🔒 100% Client-Side. Your file stays on your computer.
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 space-y-6 max-w-3xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24242A] pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Match Spreadsheet Columns</h2>
                <p className="text-xs text-gray-400 mt-1">We auto-matched detected headers. Adjust any missing mapping below.</p>
              </div>
              <span className="text-xs font-mono text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full border border-[#FF5722]/30">
                {rawRows.length} Rows Detected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
              {mappings.map(item => (
                <div key={item.standardField} className="bg-[#0E0E10] border border-[#24242A] p-3 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200">{item.label}</span>
                    {item.required && <span className="text-[10px] text-red-400 font-mono">Required</span>}
                  </div>
                  <select
                    value={item.mappedHeader || ''}
                    onChange={(e) => handleMappingChange(item.standardField, e.target.value)}
                    className="bg-[#151518] border border-[#24242A] text-xs text-white rounded-lg px-2 py-1.5 focus:border-[#FF5722] focus:outline-none"
                  >
                    <option value="">-- Ignore / Not in file --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#24242A]">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-[#24242A] text-gray-300 hover:text-white text-xs font-bold transition-all"
              >
                Back
              </button>
              <button
                onClick={runCleaning}
                className="px-6 py-3 rounded-xl bg-[#FF5722] hover:bg-[#ff6937] text-white font-bold text-xs shadow-lg shadow-[#FF5722]/20 flex items-center gap-2 transition-all"
              >
                <span>Clean & Standardize Orders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CLEAN & REVIEW */}
        {step === 3 && summary && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#151518] border border-[#24242A] p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-white font-mono">{summary.totalRowsChecked}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Orders Checked</p>
              </div>
              <div className="bg-[#151518] border border-[#00F5A0]/30 p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-[#00F5A0] font-mono">{summary.totalAutoFixed}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Issues Auto-Fixed</p>
              </div>
              <div className="bg-[#151518] border border-amber-500/30 p-5 rounded-2xl text-center">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">{attentionItems.length}</span>
                <p className="text-xs text-gray-400 font-mono mt-1">Need Attention</p>
              </div>
            </div>

            {/* Attention Cards */}
            {attentionItems.length > 0 ? (
              <div className="bg-[#151518] border border-amber-500/30 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-[#24242A] pb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{attentionItems.length} Issues Need Your Attention</span>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {attentionItems.map(item => (
                    <div key={item.id} className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">{item.orderId}</span>
                          <span className="text-xs text-gray-400">({item.customerName})</span>
                        </div>
                        <p className="text-xs text-amber-300 mt-1">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          defaultValue={item.currentValue}
                          onBlur={(e) => resolveAttentionItem(item.id, e.target.value)}
                          className="bg-[#151518] border border-[#24242A] text-xs text-white px-3 py-1.5 rounded-lg focus:border-[#FF5722] focus:outline-none w-full sm:w-40"
                          placeholder="Type correct value..."
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement)?.value;
                            resolveAttentionItem(item.id, input || item.currentValue);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#00F5A0]/20 border border-[#00F5A0]/40 text-[#00F5A0] font-bold text-xs hover:bg-[#00F5A0]/30 shrink-0"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#151518] border border-[#00F5A0]/30 rounded-3xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#00F5A0] mx-auto" />
                <h3 className="text-lg font-bold text-white">All Orders Cleaned & Ready!</h3>
                <p className="text-xs text-gray-400">Zero unresolved issues remaining. You can proceed to export.</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-[#24242A] text-gray-300 hover:text-white text-xs font-bold"
              >
                Back to Mapping
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#34f8b2] text-gray-950 font-bold text-xs shadow-lg shadow-[#00F5A0]/20 flex items-center gap-2"
              >
                <span>Proceed to Export</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EXPORT */}
        {step === 4 && (
          <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 space-y-6 max-w-2xl mx-auto text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] flex items-center justify-center mx-auto">
              <Download className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Download Clean Orders</h2>
              <p className="text-xs text-gray-400 mt-1">Export your standardized order sheet ready for fulfillment.</p>
            </div>

            {/* Column Selector */}
            <div className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-2xl text-left space-y-2">
              <span className="text-xs font-bold text-gray-300 block">Select Output Columns:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Order ID', 'Customer Name', 'Phone', 'Email', 'Address Line 1', 'Address Line 2', 'City', 'State', 'PIN Code', 'Payment Method', 'SKU', 'Product Name', 'Quantity', 'Price'].map(col => (
                  <label key={col} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportColumns.includes(col)}
                      onChange={(e) => {
                        if (e.target.checked) setExportColumns([...exportColumns, col]);
                        else setExportColumns(exportColumns.filter(c => c !== col));
                      }}
                      className="rounded border-[#24242A] text-[#FF5722] focus:ring-0 bg-[#151518]"
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => handleDownload('csv')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF5722] hover:bg-[#ff6937] text-white font-bold text-sm shadow-xl shadow-[#FF5722]/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean CSV</span>
              </button>
              <button
                onClick={() => handleDownload('xlsx')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00F5A0] hover:bg-[#34f8b2] text-gray-950 font-bold text-sm shadow-xl shadow-[#00F5A0]/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean XLSX</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#24242A]">
              <button
                onClick={() => {
                  setStep(1);
                  setRawRows([]);
                  setCleanedRows([]);
                }}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clean another file</span>
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
