import React from 'react';
import { ExportConfig, ExportFormat } from '../types';
import { Download, Archive, FileCode, Sliders, Loader2 } from 'lucide-react';
import { sanitizeSlug } from '../utils/filename';

interface ExportPanelProps {
  config: ExportConfig;
  onChangeConfig: (newConfig: ExportConfig) => void;
  selectedCount: number;
  onDownloadZip: () => void;
  isExporting: boolean;
  exportProgress: { current: number; total: number; name: string } | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  config,
  onChangeConfig,
  selectedCount,
  onDownloadZip,
  isExporting,
  exportProgress,
}) => {
  const formats: { format: ExportFormat; label: string }[] = [
    { format: 'image/jpeg', label: 'JPG / JPEG' },
    { format: 'image/png', label: 'PNG (Lossless)' },
    { format: 'image/webp', label: 'WebP (Modern)' },
  ];

  const sanitizedPreview = sanitizeSlug(config.campaignName) || 'creative';

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 space-y-5 text-gray-200">
      <div className="border-b border-gray-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Download className="w-4 h-4 text-orange-500" />
          <span>Export & Download Settings</span>
        </h3>
      </div>

      {/* Campaign Filename */}
      <div>
        <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-orange-400" />
          Campaign / Project Name
        </label>
        <input
          type="text"
          value={config.campaignName}
          onChange={(e) => onChangeConfig({ ...config, campaignName: e.target.value })}
          placeholder="e.g. summer-sale-2026"
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none font-mono"
        />
        <p className="text-[10px] text-gray-500 mt-1 font-mono">
          Filename format: <span className="text-orange-400/90">{sanitizedPreview}_[platform]_[size].[ext]</span>
        </p>
      </div>

      {/* Format Selector */}
      <div>
        <label className="text-xs font-semibold text-gray-300 block mb-1.5">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {formats.map((item) => (
            <button
              key={item.format}
              type="button"
              onClick={() => onChangeConfig({ ...config, format: item.format })}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                config.format === item.format
                  ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20'
                  : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider (JPG & WebP) */}
      {config.format !== 'image/png' && (
        <div className="p-3.5 bg-gray-950/80 rounded-xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              Quality Compression
            </span>
            <span className="font-mono text-orange-400 font-bold">
              {Math.round(config.quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="1.0"
            step="0.05"
            value={config.quality}
            onChange={(e) =>
              onChangeConfig({ ...config, quality: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-gray-800"
          />
        </div>
      )}

      {/* Export Progress Bar */}
      {isExporting && exportProgress && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs text-orange-400 font-semibold">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Packaging Images ({exportProgress.current}/{exportProgress.total})...
            </span>
            <span>{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-200"
              style={{
                width: `${(exportProgress.current / exportProgress.total) * 100}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-mono truncate">
            Processing: {exportProgress.name}
          </p>
        </div>
      )}

      {/* Primary Download Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          disabled={selectedCount === 0 || isExporting}
          onClick={onDownloadZip}
          className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2.5 transition-all duration-200"
        >
          <Archive className="w-5 h-5" />
          <span>Download All as ZIP ({selectedCount} Formats)</span>
        </button>

        <p className="text-[11px] text-center text-gray-500 font-normal">
          Generates a single ZIP containing all correctly sized creative exports.
        </p>
      </div>
    </div>
  );
};
