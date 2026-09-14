import React from 'react';
import { SkuSettings, SkuConflict } from '../types/variant';
import { Settings, AlertTriangle, X } from 'lucide-react';

interface SkuSettingsModalProps {
  settings: SkuSettings;
  conflicts: SkuConflict[];
  onChange: (updated: SkuSettings) => void;
  onClose: () => void;
}

export const SkuSettingsModal: React.FC<SkuSettingsModalProps> = ({
  settings,
  conflicts,
  onChange,
  onClose,
}) => {
  const handleCustomAbbrChange = (val: string, abbr: string) => {
    const nextMap = { ...settings.customAbbreviations, [val.toLowerCase().trim()]: abbr.toUpperCase().trim() };
    onChange({ ...settings, customAbbreviations: nextMap });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Settings className="w-5 h-5 text-sky-400" />
            <span>SKU Generation Settings</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Alert */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Abbreviation Conflicts Detected ({conflicts.length})</span>
            </div>
            <p>Different option values share the same automatic SKU abbreviation code:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-300">
              {conflicts.map((c, idx) => (
                <li key={idx}>
                  <span className="font-medium">"{c.value1}"</span> & <span className="font-medium">"{c.value2}"</span> both produce code <code className="bg-slate-900 px-1 py-0.5 rounded font-mono font-bold text-amber-400">{c.abbreviation}</code>. Please add a custom abbreviation override below.
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Separator Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            SKU Separator
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Hyphen ( - )', value: '-' },
              { label: 'Underscore ( _ )', value: '_' },
              { label: 'None', value: '' },
            ].map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange({ ...settings, separator: item.value as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  settings.separator === item.value
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Casing Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            SKU Casing
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'UPPERCASE (OT-BLK-S)', value: 'UPPERCASE' },
              { label: 'lowercase (ot-blk-s)', value: 'lowercase' },
            ].map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange({ ...settings, casing: item.value as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  settings.casing === item.value
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Use Abbreviations Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700/80">
          <div>
            <span className="block text-xs font-semibold text-white">Use Automatic Abbreviations</span>
            <span className="block text-[11px] text-slate-400">Shorten Black to BLK, Extra Large to XL, etc.</span>
          </div>
          <input
            type="checkbox"
            checked={settings.useAbbreviations}
            onChange={e => onChange({ ...settings, useAbbreviations: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
          />
        </div>

        {/* Custom Abbreviation Overrides */}
        {conflicts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-700">
            <label className="block text-xs font-semibold text-slate-300">
              Resolve Conflicts (Custom Overrides)
            </label>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {conflicts.map((c, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                    <span className="truncate">{c.value2}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. LBR"
                    value={settings.customAbbreviations[c.value2.toLowerCase().trim()] || ''}
                    onChange={e => handleCustomAbbrChange(c.value2, e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
