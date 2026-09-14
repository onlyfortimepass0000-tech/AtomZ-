import React, { useEffect, useRef, useState } from 'react';
import { ImageAdjustment, LoadedImage, PlatformPreset } from '../types';
import { renderImageToCanvas } from '../utils/canvasEngine';
import { X, Download } from 'lucide-react';
import { generateFilename } from '../utils/filename';
import { downloadBlob } from '../utils/zipExporter';
import { exportCanvasToBlob } from '../utils/canvasEngine';

interface PreviewModalProps {
  preset: PlatformPreset | null;
  image: LoadedImage;
  adjustment: ImageAdjustment;
  campaignName: string;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  preset,
  image,
  adjustment,
  campaignName,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!preset) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.src;
    img.onload = () => setImgObj(img);
  }, [image.src, preset]);

  useEffect(() => {
    if (!preset || !canvasRef.current || !imgObj) return;

    const rendered = renderImageToCanvas(imgObj, preset.width, preset.height, adjustment);
    const canvas = canvasRef.current;
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(rendered, 0, 0);

      // Safe zone guide
      if (adjustment.showSafeZone && preset.hasSafeZone && preset.safeZone) {
        const topH = (preset.height * preset.safeZone.topPct) / 100;
        const botH = (preset.height * preset.safeZone.bottomPct) / 100;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(0, 0, preset.width, topH);
        ctx.fillRect(0, preset.height - botH, preset.width, botH);

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = Math.max(3, preset.height * 0.005);
        ctx.setLineDash([10, 10]);

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

  if (!preset) return null;

  const handleDownloadSingle = async () => {
    if (!imgObj) return;
    const canvas = renderImageToCanvas(imgObj, preset.width, preset.height, adjustment);
    const blob = await exportCanvasToBlob(canvas, 'image/jpeg', 0.92);
    const fileName = generateFilename(
      campaignName,
      preset.platform,
      preset.name,
      preset.width,
      preset.height,
      'image/jpeg'
    );
    downloadBlob(blob, fileName);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{preset.name}</span>
              <span className="text-xs font-normal text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {preset.platform}
              </span>
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Dimensions: {preset.width} × {preset.height} px
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Canvas View */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-black/60 rounded-xl p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-h-[60vh] max-w-full object-contain rounded shadow-2xl"
          />
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-gray-800 pt-3">
          <span className="text-xs text-gray-400">
            {adjustment.showSafeZone && preset.hasSafeZone
              ? '⚠️ Safe Zone guides shown in modal are excluded during export.'
              : 'Exact resolution output preview'}
          </span>

          <button
            type="button"
            onClick={handleDownloadSingle}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download This Format</span>
          </button>
        </div>
      </div>
    </div>
  );
};
