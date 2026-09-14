import React from 'react';
import { PatternGroup } from '../types/surgeon';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface PatternFixCardProps {
  group: PatternGroup;
  onApplyFix: (patternKey: string) => void;
}

export const PatternFixCard: React.FC<PatternFixCardProps> = ({ group, onApplyFix }) => {
  return (
    <div className="bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-all">
      <div className="space-y-2 flex-1 min-w-[260px]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold font-mono">
            {group.affectedRowsCount.toLocaleString()} rows affected
          </span>
          <h4 className="text-sm font-bold text-white">{group.title}</h4>
        </div>
        <p className="text-xs text-slate-400 font-medium">{group.description}</p>

        {/* Value Transformation Preview */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-rose-400 line-through">{group.fromValueSample || '[empty]'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-emerald-400 font-bold">{group.toValueSample}</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onApplyFix(group.patternKey)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Fix all {group.affectedRowsCount.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
};
