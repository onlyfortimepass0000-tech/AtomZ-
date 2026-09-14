import React from 'react';
import { HelpAssistant } from './HelpAssistant';
import { ArrowLeft, ShieldCheck, RotateCcw, RefreshCw } from 'lucide-react';

interface HeaderProps {
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  hasFile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ canUndo, onUndo, onReset, hasFile }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/tools.html"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
            title="Back to Atomz Tools"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tools</span>
          </a>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>CSV Surgeon</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono">
                Catalog Repair Tool
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Local Browser Processing</span>
          </div>

          {canUndo && (
            <button
              onClick={onUndo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Undo last fix"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Undo</span>
            </button>
          )}

          {hasFile && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Upload new file"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Start Over</span>
            </button>
          )}

          <HelpAssistant />
        </div>
      </div>
    </header>
  );
};
