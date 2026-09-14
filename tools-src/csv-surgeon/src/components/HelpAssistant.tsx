import React, { useState, useEffect } from 'react';
import { HelpCircle, X, CheckCircle2 } from 'lucide-react';

export const HelpAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenHelp, setHasSeenHelp] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('csvsurgeon_help_seen');
    if (!seen) {
      setHasSeenHelp(false);
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasSeenHelp(true);
    localStorage.setItem('csvsurgeon_help_seen', 'true');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block z-40">
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm relative group"
      >
        <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>How to use</span>
        {!hasSeenHelp && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />
          <div className="absolute right-0 top-full mt-2 w-80 p-5 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 text-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  ?
                </div>
                <h4 className="font-semibold text-sm text-white">How to use</h4>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
              Give us the file that is failing.
            </p>

            <div className="space-y-3 mb-4 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <div>
                  <span className="font-medium text-white">Upload your file</span>
                  <p className="text-slate-400 text-[11px]">Upload your CSV or spreadsheet file.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">2</span>
                <div>
                  <span className="font-medium text-white">Choose destination</span>
                  <p className="text-slate-400 text-[11px]">Choose Shopify, Meta, Google, or Generic CSV.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">3</span>
                <div>
                  <span className="font-medium text-white">Repair & download</span>
                  <p className="text-slate-400 text-[11px]">Fix the few things needing input, then download.</p>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 mb-4 flex items-start gap-2">
              <span className="font-bold">Tip:</span> Most formatting & currency problems can be repaired automatically.
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Got it</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
