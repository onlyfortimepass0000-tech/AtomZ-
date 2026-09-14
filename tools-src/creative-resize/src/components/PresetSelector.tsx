import React, { useState } from 'react';
import { PlatformPreset } from '../types';
import { PLATFORM_PRESETS } from '../constants/presets';
import { CheckSquare, Square, Plus, Trash2, SlidersHorizontal } from 'lucide-react';

interface PresetSelectorProps {
  selectedPresetIds: string[];
  onTogglePreset: (presetId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  customPresets: PlatformPreset[];
  onAddCustomPreset: (preset: PlatformPreset) => void;
  onRemoveCustomPreset: (presetId: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetIds,
  onTogglePreset,
  onSelectAll,
  onDeselectAll,
  customPresets,
  onAddCustomPreset,
  onRemoveCustomPreset,
}) => {
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>('All');

  // Custom size form state
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [customName, setCustomName] = useState<string>('Custom Format');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);

  const allPresets = [...PLATFORM_PRESETS, ...customPresets];

  const platforms = ['All', ...Array.from(new Set(allPresets.map((p) => p.platform)))];

  const filteredPresets =
    activePlatformFilter === 'All'
      ? allPresets
      : allPresets.filter((p) => p.platform === activePlatformFilter);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customWidth <= 0 || customHeight <= 0) return;

    const newCustom: PlatformPreset = {
      id: `custom-${Date.now()}`,
      platform: 'Custom',
      name: customName || `Custom ${customWidth}x${customHeight}`,
      width: customWidth,
      height: customHeight,
      aspectRatio: customWidth / customHeight,
      hasSafeZone: false,
      isCustom: true,
    };

    onAddCustomPreset(newCustom);
    setShowCustomForm(false);
    setCustomName('Custom Format');
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 space-y-5 text-gray-200">
      {/* Header & Global Select/Deselect */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            <span>Target Platforms & Presets</span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {selectedPresetIds.length} of {allPresets.length} formats selected
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-orange-400 hover:text-orange-300 font-semibold hover:underline"
          >
            Select All
          </button>
          <span className="text-gray-700">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-gray-400 hover:text-gray-200 font-semibold hover:underline"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Platform Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
        {platforms.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => setActivePlatformFilter(platform)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors border ${
              activePlatformFilter === platform
                ? 'bg-orange-600 border-orange-500 text-white'
                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Presets Checkbox Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetIds.includes(preset.id);
          return (
            <div
              key={preset.id}
              onClick={() => onTogglePreset(preset.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 select-none ${
                isSelected
                  ? 'bg-orange-500/10 border-orange-500/50 text-white'
                  : 'bg-gray-950/40 border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 text-orange-400">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      ({preset.platform})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                    {preset.width} × {preset.height} px
                  </div>
                </div>
              </div>

              {preset.isCustom && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomPreset(preset.id);
                  }}
                  className="text-gray-500 hover:text-red-400 p-1"
                  title="Remove Custom Size"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Size Section */}
      <div className="pt-2 border-t border-gray-800">
        {!showCustomForm ? (
          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-gray-950/80 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Size (px)</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddCustom}
            className="p-3 bg-gray-950/80 border border-gray-800 rounded-xl space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>New Custom Dimensions</span>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="text-gray-500 hover:text-gray-300 text-[11px]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Width (px)</label>
                <input
                  type="number"
                  min="10"
                  max="8000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Height (px)</label>
                <input
                  type="number"
                  min="10"
                  max="8000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Preset Label</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Website Banner"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Save Custom Size
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
