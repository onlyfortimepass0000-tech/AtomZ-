import React, { useState } from 'react';
import { OptionGroup, OptionValue, SkuSettings, SkuConflict } from '../types/variant';
import { SkuSettingsModal } from './SkuSettingsModal';
import { calculateTotalCombinations } from '../utils/combinator';
import { detectAbbreviationConflicts } from '../utils/abbreviations';
import { Plus, X, Settings, AlertTriangle, Layers, Sparkles } from 'lucide-react';

interface StepOptionsProps {
  optionGroups: OptionGroup[];
  skuSettings: SkuSettings;
  onChangeOptions: (groups: OptionGroup[]) => void;
  onChangeSkuSettings: (settings: SkuSettings) => void;
  onGenerate: () => void;
}

export const StepOptions: React.FC<StepOptionsProps> = ({
  optionGroups,
  skuSettings,
  onChangeOptions,
  onChangeSkuSettings,
  onGenerate,
}) => {
  const [showSkuSettings, setShowSkuSettings] = useState(false);
  const [inputBuffer, setInputBuffer] = useState<Record<string, string>>({});

  const totalVariants = calculateTotalCombinations(optionGroups);

  // Check conflicts
  const allOptionValues = optionGroups.flatMap(g => g.values.map(v => v.value));
  const conflicts: SkuConflict[] = skuSettings.useAbbreviations
    ? detectAbbreviationConflicts(allOptionValues, skuSettings.customAbbreviations)
    : [];

  const addOptionGroup = (name: string) => {
    const nextGroup: OptionGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      values: [],
    };
    onChangeOptions([...optionGroups, nextGroup]);
  };

  const removeOptionGroup = (groupId: string) => {
    onChangeOptions(optionGroups.filter(g => g.id !== groupId));
  };

  const updateGroupName = (groupId: string, name: string) => {
    onChangeOptions(
      optionGroups.map(g => (g.id === groupId ? { ...g, name } : g))
    );
  };

  const addValuesToGroup = (groupId: string, rawText: string) => {
    if (!rawText.trim()) return;
    const splitVals = rawText
      .split(/[,;\n]+/)
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (splitVals.length === 0) return;

    const group = optionGroups.find(g => g.id === groupId);
    if (!group) return;

    const existingSet = new Set(group.values.map(v => v.value.toLowerCase()));
    const newValues: OptionValue[] = [...group.values];

    for (const val of splitVals) {
      if (!existingSet.has(val.toLowerCase())) {
        existingSet.add(val.toLowerCase());
        newValues.push({
          id: `val_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          value: val,
        });
      }
    }

    onChangeOptions(
      optionGroups.map(g => (g.id === groupId ? { ...g, values: newValues } : g))
    );

    setInputBuffer({ ...inputBuffer, [groupId]: '' });
  };

  const removeValueFromGroup = (groupId: string, valId: string) => {
    onChangeOptions(
      optionGroups.map(g => {
        if (g.id === groupId) {
          return { ...g, values: g.values.filter(v => v.id !== valId) };
        }
        return g;
      })
    );
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-5 shadow-lg space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Product Options</h2>
            <p className="text-xs text-slate-400">Add attributes like Color, Size, Fit, or Material</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSkuSettings(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all relative ${
            conflicts.length > 0
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>SKU Settings</span>
          {conflicts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-400">Quick Option Presets:</span>
        <div className="flex flex-wrap gap-2">
          {['Color', 'Size', 'Material', 'Fit', 'Style'].map(preset => {
            const exists = optionGroups.some(g => g.name.toLowerCase() === preset.toLowerCase());
            return (
              <button
                key={preset}
                type="button"
                onClick={() => !exists && addOptionGroup(preset)}
                disabled={exists}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  exists
                    ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-500/50 hover:text-sky-300'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>+ {preset}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => addOptionGroup('Custom Option')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-500/50 hover:text-sky-300"
          >
            <Plus className="w-3 h-3" />
            <span>+ Custom</span>
          </button>
        </div>
      </div>

      {/* Option Groups List */}
      <div className="space-y-4">
        {optionGroups.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-700/80 rounded-2xl bg-slate-900/40">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No options added yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">Click one of the quick presets above to add Color, Size, or custom attributes.</p>
          </div>
        ) : (
          optionGroups.map((group, gIdx) => (
            <div
              key={group.id}
              className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-3 relative group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-sky-400 font-mono">Option {gIdx + 1}:</span>
                  <input
                    type="text"
                    value={group.name}
                    onChange={e => updateGroupName(group.id, e.target.value)}
                    placeholder="Option Name (e.g. Color)"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeOptionGroup(group.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition-colors"
                  title="Remove option group"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tag Input */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Values (Press Enter or paste comma-separated):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputBuffer[group.id] || ''}
                    onChange={e => setInputBuffer({ ...inputBuffer, [group.id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addValuesToGroup(group.id, inputBuffer[group.id] || '');
                      }
                    }}
                    onBlur={() => {
                      if (inputBuffer[group.id]?.trim()) {
                        addValuesToGroup(group.id, inputBuffer[group.id] || '');
                      }
                    }}
                    placeholder="e.g. Black, White, Navy"
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => addValuesToGroup(group.id, inputBuffer[group.id] || '')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Chips List */}
              {group.values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.values.map(valObj => (
                    <span
                      key={valObj.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700/90 rounded-lg text-xs font-medium text-slate-200 group/chip"
                    >
                      <span>{valObj.value}</span>
                      <button
                        type="button"
                        onClick={() => removeValueFromGroup(group.id, valObj.id)}
                        className="text-slate-500 hover:text-rose-400 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Live Counter & Warnings */}
      {optionGroups.length > 0 && (
        <div className="space-y-3 pt-2">
          {totalVariants > 1000 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>You are about to create <strong className="font-bold text-amber-300">{totalVariants.toLocaleString()} variants</strong>. Large sets may take longer to manage.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 rounded-2xl border border-sky-500/30">
            <div>
              <span className="block text-xs font-semibold text-slate-400">Total Combinations:</span>
              <span className="text-xl font-extrabold text-sky-400 font-mono">
                {totalVariants.toLocaleString()} variants
              </span>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={totalVariants === 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                totalVariants > 0
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Variants</span>
            </button>
          </div>
        </div>
      )}

      {/* SKU Settings Modal */}
      {showSkuSettings && (
        <SkuSettingsModal
          settings={skuSettings}
          conflicts={conflicts}
          onChange={onChangeSkuSettings}
          onClose={() => setShowSkuSettings(false)}
        />
      )}
    </div>
  );
};
