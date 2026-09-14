import React, { useState } from 'react';
import { BulkEditOptions, OptionGroup } from '../types/variant';
import { Sliders, X, Check } from 'lucide-react';

interface BulkEditModalProps {
  optionGroups: OptionGroup[];
  onApply: (options: BulkEditOptions) => void;
  onClose: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  optionGroups,
  onApply,
  onClose,
}) => {
  const [action, setAction] = useState<BulkEditOptions['action']>('SET_ALL_PRICES');
  const [targetValue, setTargetValue] = useState<number>(1299);
  const [targetOptionName, setTargetOptionName] = useState<string>(optionGroups[0]?.name || '');
  const [targetOptionValue, setTargetOptionValue] = useState<string>('');

  const activeGroup = optionGroups.find(g => g.name === targetOptionName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      action,
      targetValue: Number(targetValue) || 0,
      targetOptionName: action.includes('OPTION') || action.includes('DELTA') ? targetOptionName : undefined,
      targetOptionValue: action.includes('OPTION') || action.includes('DELTA') ? targetOptionValue : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Sliders className="w-5 h-5 text-sky-400" />
            <span>Bulk Edit Variants</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Bulk Action
            </label>
            <select
              value={action}
              onChange={e => setAction(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="SET_ALL_PRICES">Set price for ALL variants</option>
              <option value="SET_ALL_INVENTORY">Set inventory quantity for ALL variants</option>
              <option value="ADD_PRICE_DELTA">Add price delta (e.g. +₹100) to specific option</option>
              <option value="SET_OPTION_PRICE">Set fixed price for specific option</option>
            </select>
          </div>

          {/* Option Filters if Delta or Option Specific */}
          {(action === 'ADD_PRICE_DELTA' || action === 'SET_OPTION_PRICE') && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Option</label>
                <select
                  value={targetOptionName}
                  onChange={e => {
                    setTargetOptionName(e.target.value);
                    const g = optionGroups.find(x => x.name === e.target.value);
                    if (g && g.values.length > 0) setTargetOptionValue(g.values[0].value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  {optionGroups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Value</label>
                <select
                  value={targetOptionValue}
                  onChange={e => setTargetOptionValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="">(All {targetOptionName} values)</option>
                  {activeGroup?.values.map(v => (
                    <option key={v.id} value={v.value}>{v.value}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Target Value Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {action === 'SET_ALL_PRICES' || action === 'SET_OPTION_PRICE' ? 'New Price (₹)' :
               action === 'SET_ALL_INVENTORY' ? 'New Inventory Count' : 'Price Delta (₹, e.g. 100 or -50)'}
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={e => setTargetValue(Number(e.target.value))}
              placeholder="e.g. 1299"
              step="any"
              required
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Bulk Edit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
