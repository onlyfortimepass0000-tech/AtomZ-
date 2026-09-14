import React, { useEffect, useRef, useState } from 'react';
import { ImageAdjustment, LoadedImage, PlatformPreset } from '../types';
import { renderImageToCanvas } from '../utils/canvasEngine';
import { Maximize2, X, Eye } from 'lucide-react';

interface PreviewItemProps {
  preset: PlatformPreset;
  image: LoadedImage;
  adjustment: ImageAdjustment;
  onOpenModal: (preset: PlatformPreset) => void;
  onDeselect: (presetId: string) => void;
}

const PreviewItem: React.FC<PreviewItemProps> = ({
  preset,
  image,
  adjustment,
  onOpenModal,
  onDeselect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.src;
    img.onload = () => setImgObj(img);
  }, [image.src]);

  useEffect(() => {
    if (!canvasRef.current || !imgObj) return;

    const canvas = renderImageToCanvas(
      imgObj,
      preset.width,
      preset.height,
      adjustment
    );

    const targetCanvas = canvasRef.current;
    targetCanvas.width = preset.width;
    targetCanvas.height = preset.height;
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);

      // Render visual safe zone guide if enabled and preset supports safe zone
      if (adjustment.showSafeZone && preset.hasSafeZone && preset.safeZone) {
        const topH = (preset.height * preset.safeZone.topPct) / 100;
        const botH = (preset.height * preset.safeZone.bottomPct) / 100;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(0, 0, preset.width, topH);
        ctx.fillRect(0, preset.height - botH, preset.width, botH);

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = Math.max(2, preset.height * 0.005);
        ctx.setLineDash([8, 8]);

        ctx.beginPath();
        ctx.moveTo(0, topH);
        ctx.lineTo(preset.width, topH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, preset.height - botH);
        ctx.lineTo(preset.width, preset.height - botH);
        ctx.stroke();
      }
    }
  }, [imgObj, preset, adjustment]);

  return (
    <div className="bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden flex flex-col group relative hover:border-gray-700 transition-colors">
      {/* Top Card Info Bar */}
      <div className="p-2.5 bg-gray-900/90 border-b border-gray-800/80 flex items-center justify-between gap-1 text-xs">
        <div className="truncate">
          <span className="font-semibold text-white block truncate">{preset.name}</span>
          <span className="text-[10px] text-gray-400 block font-mono">
            {preset.platform} · {preset.width}×{preset.height}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpenModal(preset)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Enlarge Preview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeselect(preset.id)}
            className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
            title="Deselect Format"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnail Canvas */}
      <div
        onClick={() => onOpenModal(preset)}
        className="p-3 flex items-center justify-center bg-black/50 cursor-pointer min-h-[160px] relative group-hover:bg-black/30 transition-colors"
      >
        <canvas
          ref={canvasRef}
          className="max-h-44 max-w-full object-contain rounded shadow-lg"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
          <Eye className="w-4 h-4 text-orange-400" />
          <span>Click to Enlarge</span>
        </div>
      </div>
    </div>
  );
};

interface PreviewGridProps {
  selectedPresets: PlatformPreset[];
  image: LoadedImage;
  adjustment: ImageAdjustment;
  onOpenModal: (preset: PlatformPreset) => void;
  onDeselectPreset: (presetId: string) => void;
}

export const PreviewGrid: React.FC<PreviewGridProps> = ({
  selectedPresets,
  image,
  adjustment,
  onOpenModal,
  onDeselectPreset,
}) => {
  if (selectedPresets.length === 0) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
        <p className="text-sm">No platform sizes selected.</p>
        <p className="text-xs text-gray-500 mt-1">Select formats above to generate previews.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Output Previews ({selectedPresets.length})</span>
        </h3>
        <span className="text-xs text-gray-400">
          Showing real-time canvas crop for each selected format
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {selectedPresets.map((preset) => (
          <PreviewItem
            key={preset.id}
            preset={preset}
            image={image}
            adjustment={adjustment}
            onOpenModal={onOpenModal}
            onDeselect={onDeselectPreset}
          />
        ))}
      </div>
    </div>
  );
};
