import React, { useState } from 'react';
import { IssueItem } from '../types/surgeon';
import { AlertCircle, Check, ArrowRight } from 'lucide-react';

interface HumanReviewCardProps {
  issue: IssueItem;
  currentIndex: number;
  totalIssues: number;
  onResolve: (issueId: string, val: string) => void;
}

export const HumanReviewCard: React.FC<HumanReviewCardProps> = ({
  issue,
  currentIndex,
  totalIssues,
  onResolve,
}) => {
  const [inputValue, setInputValue] = useState<string>(issue.suggestedValue || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onResolve(issue.id, inputValue);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6 max-w-xl mx-auto animate-in fade-in duration-200">
      {/* Step counter badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold rounded-full">
          Problem {currentIndex + 1} of {totalIssues}
        </span>
        <span className="text-xs text-slate-400 font-mono font-semibold">
          Row {issue.rowIndex} {issue.productContext ? `• ${issue.productContext}` : ''}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-white">{issue.message}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Field: <code className="text-sky-400 font-mono">{issue.field}</code></p>
          </div>
        </div>

        {/* Current vs Suggested value comparison */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
          <div className="text-slate-400">Current Value: <span className="text-rose-400">{String(issue.originalValue) || '[ empty ]'}</span></div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Enter or update value for {issue.field}:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type value here..."
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onResolve(issue.id, issue.originalValue || '')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Skip for now
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <span>Save & Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
