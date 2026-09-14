import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';

interface StageScanProps {
  totalRows: number;
  onScanFinished: () => void;
}

export const StageScan: React.FC<StageScanProps> = ({ totalRows, onScanFinished }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    `Reading ${totalRows.toLocaleString()} rows…`,
    'Checking product IDs & handles…',
    'Checking price formats & currency symbols…',
    'Checking availability & inventory values…',
    'Checking URLs & image protocols…',
    'Checking required fields & headers…',
    'Checking duplicates & row integrity…',
    'Generating repair matrix…',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onScanFinished();
          }, 400);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(timer);
  }, [steps.length, onScanFinished]);

  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-8 animate-in fade-in duration-200">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Activity className="w-10 h-10 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-white">Scanning Spreadsheet…</h2>
        <p className="text-sm text-slate-400 font-medium">Running deterministic diagnosis on dataset</p>
      </div>

      {/* Steps checklist animation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-3 shadow-2xl font-mono text-xs">
        {steps.slice(0, currentStep + 1).map((stepText, idx) => (
          <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
            {idx < currentStep ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
            )}
            <span className={idx === currentStep ? 'text-white font-bold' : 'text-slate-400'}>
              {stepText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
