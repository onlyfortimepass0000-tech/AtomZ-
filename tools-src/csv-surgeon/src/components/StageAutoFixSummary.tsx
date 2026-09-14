import React, { useState } from 'react';
import { PatternGroup, IssueItem, CellDiff } from '../types/surgeon';
import { PatternFixCard } from './PatternFixCard';
import { BeforeAfterModal } from './BeforeAfterModal';
import { Sparkles, ArrowRight, Eye, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StageAutoFixSummaryProps {
  totalIssuesCount: number;
  autoFixableCount: number;
  humanInputCount: number;
  patternGroups: PatternGroup[];
  diffs: CellDiff[];
  onFixAllSafe: () => void;
  onApplyPatternFix: (patternKey: string) => void;
  onStartHumanReview: () => void;
}

export const StageAutoFixSummary: React.FC<StageAutoFixSummaryProps> = ({
  totalIssuesCount,
  autoFixableCount,
  humanInputCount,
  patternGroups,
  diffs,
  onFixAllSafe,
  onApplyPatternFix,
  onStartHumanReview,
}) => {
  const [showDiffsModal, setShowDiffsModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 animate-in fade-in duration-300">
      {/* Wow Headline Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
          <span>Diagnosis Complete</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {totalIssuesCount === 0 ? 'Zero problems found!' : `${totalIssuesCount} problems found`}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm font-semibold">
            <span className="px-3.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ {autoFixableCount} can be repaired automatically
            </span>
            {humanInputCount > 0 && (
              <span className="px-3.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ⚠ {humanInputCount} need your input
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800">
          {autoFixableCount > 0 && (
            <button
              type="button"
              onClick={onFixAllSafe}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2.5 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>Fix Everything Safe ({autoFixableCount})</span>
            </button>
          )}

          {humanInputCount > 0 && (
            <button
              type="button"
              onClick={onStartHumanReview}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl font-bold text-sm shadow transition-all flex items-center gap-2"
            >
              <span>Review {humanInputCount} Problems</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDiffsModal(true)}
            className="px-4 py-3.5 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Show what changed ({diffs.length})</span>
          </button>
        </div>
      </div>

      {/* Pattern Groups section if any */}
      {patternGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Smart Pattern Fixes</span>
              <span className="text-xs font-mono font-medium text-slate-400">({patternGroups.length} patterns)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Click to apply 1-click batch fix across all matching rows</span>
          </div>

          <div className="space-y-3">
            {patternGroups.map((group, idx) => (
              <PatternFixCard
                key={idx}
                group={group}
                onApplyFix={onApplyPatternFix}
              />
            ))}
          </div>
        </div>
      )}

      {showDiffsModal && (
        <BeforeAfterModal
          diffs={diffs}
          onClose={() => setShowDiffsModal(false)}
        />
      )}
    </div>
  );
};
