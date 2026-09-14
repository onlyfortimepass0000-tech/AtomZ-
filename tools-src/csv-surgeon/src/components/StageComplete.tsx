import React, { useState } from 'react';
import { RepairLogRecord, PlatformDestination, CellDiff } from '../types/surgeon';
import { exportFixedSpreadsheet, exportRepairReport } from '../engine/exporter';
import { BeforeAfterModal } from './BeforeAfterModal';
import { CheckCircle2, Download, FileSpreadsheet, Eye, Sparkles } from 'lucide-react';

interface StageCompleteProps {
  totalRows: number;
  autoRepairedCount: number;
  humanFixedCount: number;
  headers: string[];
  rows: Record<string, any>[];
  repairLogs: RepairLogRecord[];
  diffs: CellDiff[];
  fileName: string;
  platform: PlatformDestination;
}

export const StageComplete: React.FC<StageCompleteProps> = ({
  totalRows,
  autoRepairedCount,
  humanFixedCount,
  headers,
  rows,
  repairLogs,
  diffs,
  fileName,
  platform,
}) => {
  const [showDiffs, setShowDiffs] = useState(false);

  const handleDownloadFile = (format: 'csv' | 'xlsx') => {
    exportFixedSpreadsheet(headers, rows, fileName, platform, format);
  };

  const handleDownloadReport = () => {
    exportRepairReport(repairLogs, fileName);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 text-center space-y-8 animate-in fade-in duration-300">
      {/* Success Badge */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Your file is ready.
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Cleaned, normalized, and validated for {platform} import.
        </p>
      </div>

      {/* Repair Summary Checklist Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left space-y-3 shadow-2xl font-mono text-xs max-w-lg mx-auto">
        <div className="flex items-center gap-3 text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{totalRows.toLocaleString()} rows checked</span>
        </div>
        <div className="flex items-center gap-3 text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{autoRepairedCount.toLocaleString()} issues repaired automatically</span>
        </div>
        <div className="flex items-center gap-3 text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{humanFixedCount.toLocaleString()} issues corrected by you</span>
        </div>
        <div className="flex items-center gap-3 text-emerald-400 font-bold pt-1 border-t border-slate-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>0 blocking errors remaining</span>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleDownloadFile('csv')}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2.5 active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Download Fixed CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFile('xlsx')}
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl font-bold text-sm shadow transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Download XLSX</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download Repair Report CSV</span>
          </button>

          <span className="text-slate-700">&bull;</span>

          <button
            type="button"
            onClick={() => setShowDiffs(true)}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>View Repair Log ({diffs.length} diffs)</span>
          </button>
        </div>
      </div>

      {showDiffs && (
        <BeforeAfterModal
          diffs={diffs}
          onClose={() => setShowDiffs(false)}
        />
      )}
    </div>
  );
};
