import React from 'react';
import { ImageAdjustment } from '../types';
import { ZoomIn, RotateCcw, Maximize2, Minimize2, Eye, Palette } from 'lucide-react';

interface EditorControlsProps {
  adjustment: ImageAdjustment;
  onChange: (newAdj: ImageAdjustment) => void;
  onReset: () => void;
}

export const EditorControls: React.FC<EditorControlsProps> = ({
  adjustment,
  onChange,
  onReset,
}) => {
  const PRESET_BG_COLORS = ['#000000', '#FFFFFF', '#0A0A0C', '#1E293B', '#FF5722', '#2563EB', '#10B981'];

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 space-y-5 text-gray-200">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Creative Controls
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1 bg-gray-800/60 hover:bg-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-700/50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Adjustments</span>
        </button>
      </div>

      {/* Mode Selector: Crop to Fill vs Fit with Background */}
      <div>
        <label className="text-xs font-semibold text-gray-300 block mb-2">
          Fitting Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...adjustment, fitMode: 'crop' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
              adjustment.fitMode === 'crop'
                ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20'
                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span>Crop to Fill</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...adjustment, fitMode: 'fit' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
              adjustment.fitMode === 'fit'
                ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20'
                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <Minimize2 className="w-4 h-4" />
            <span>Fit with Background</span>
          </button>
        </div>
      </div>

      {/* Background Color Picker (Shown when Fit Mode is active) */}
      {adjustment.fitMode === 'fit' && (
        <div className="p-3.5 bg-gray-950/80 rounded-xl border border-gray-800 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-orange-400" />
              Background Color
            </span>
            <input
              type="color"
              value={adjustment.bgColor}
              onChange={(e) => onChange({ ...adjustment, bgColor: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_BG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ ...adjustment, bgColor: color })}
                style={{ backgroundColor: color }}
                className={`w-6 h-6 rounded-full border transition-transform ${
                  adjustment.bgColor === color
                    ? 'border-orange-500 scale-125 ring-2 ring-orange-500/40'
                    : 'border-gray-700 hover:scale-110'
                }`}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Zoom Slider */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4 text-orange-400" />
            Zoom Level
          </span>
          <span className="font-mono text-orange-400 font-bold">
            {Math.round(adjustment.zoom * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.05"
          value={adjustment.zoom}
          onChange={(e) => onChange({ ...adjustment, zoom: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-gray-800"
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
          <span>50%</span>
          <span>100%</span>
          <span>300%</span>
        </div>
      </div>

      {/* Safe Zone Toggle */}
      <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-400" />
            Story/Reel Safe Zones Overlay
          </span>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Visual guide only — omitted during export
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...adjustment, showSafeZone: !adjustment.showSafeZone })}
          className={`w-11 h-6 rounded-full transition-colors relative border ${
            adjustment.showSafeZone
              ? 'bg-blue-600 border-blue-500'
              : 'bg-gray-950 border-gray-800'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
              adjustment.showSafeZone ? 'right-1' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
