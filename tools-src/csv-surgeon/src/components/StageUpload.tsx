import React from 'react';
import { Upload, FileSpreadsheet, Lock, Sparkles } from 'lucide-react';
import { parseSpreadsheetFile } from '../engine/parser';
import brokenShopifyCsv from '../fixtures/broken_shopify.csv?raw';
import brokenMetaCsv from '../fixtures/broken_meta.csv?raw';

interface StageUploadProps {
  onFileLoaded: (fileName: string, headers: string[], rows: Record<string, any>[]) => void;
}

export const StageUpload: React.FC<StageUploadProps> = ({ onFileLoaded }) => {
  const handleFileSelect = async (file: File) => {
    try {
      const res = await parseSpreadsheetFile(file);
      onFileLoaded(file.name, res.headers, res.rows);
    } catch (err) {
      alert('Failed to parse file. Please upload a valid CSV, XLSX, or XLS spreadsheet.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDemoClick = (type: 'shopify' | 'meta') => {
    const content = type === 'shopify' ? brokenShopifyCsv : brokenMetaCsv;
    const blob = new Blob([content], { type: 'text/csv' });
    const file = new File([blob], `sample_broken_${type}.csv`, { type: 'text/csv' });
    handleFileSelect(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 text-center animate-in fade-in duration-300">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ecommerce Catalog Repair Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Upload the file that refuses to work.
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          We’ll find what’s broken, repair what we safely can, and show you exactly what still needs attention.
        </p>
      </div>

      {/* Upload Drop Zone */}
      <div className="max-w-2xl mx-auto">
        <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl bg-slate-900/80 hover:bg-slate-900 cursor-pointer transition-all duration-200 group shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
            Click or drag your CSV / XLSX file here
          </span>
          <span className="text-xs text-slate-400 mt-1 font-mono">Supports CSV, XLSX, XLS formats</span>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400/90 font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Processed locally in your browser. Your file is never uploaded.</span>
        </div>
      </div>

      {/* Demo Sample Triggers */}
      <div className="pt-6 border-t border-slate-800/80 max-w-xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Don't have a broken file ready? Try a sample demo file:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleDemoClick('shopify')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Try Broken Shopify CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoClick('meta')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>Try Broken Meta Catalog CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
