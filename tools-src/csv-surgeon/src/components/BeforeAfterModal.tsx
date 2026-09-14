import React from 'react';
import { CellDiff } from '../types/surgeon';
import { X, ArrowRight, Eye } from 'lucide-react';

interface BeforeAfterModalProps {
  diffs: CellDiff[];
  onClose: () => void;
}

export const BeforeAfterModal: React.FC<BeforeAfterModalProps> = ({ diffs, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Eye className="w-5 h-5 text-emerald-400" />
            <span>Before / After Repair Log ({diffs.length} changes)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 font-mono text-xs space-y-2">
          {diffs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-sans">
              No automatic formatting diffs applied yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold text-[11px] border-b border-slate-800">
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Before</th>
                  <th className="py-2.5 px-3"></th>
                  <th className="py-2.5 px-3">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {diffs.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-500">{d.rowIndex}</td>
                    <td className="py-2 px-3 text-slate-300 font-bold">{d.field}</td>
                    <td className="py-2 px-3 text-rose-400 max-w-[180px] truncate">{d.before || '[empty]'}</td>
                    <td className="py-2 px-1 text-slate-500"><ArrowRight className="w-3.5 h-3.5" /></td>
                    <td className="py-2 px-3 text-emerald-400 font-bold max-w-[180px] truncate">{d.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
