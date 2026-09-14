import React, { useRef, useState, useEffect } from 'react';
import { ImageAdjustment, LoadedImage } from '../types';
import { calculateDrawParams } from '../utils/canvasEngine';
import { Move, ZoomIn, RotateCcw } from 'lucide-react';

interface InteractiveCanvasProps {
  image: LoadedImage;
  adjustment: ImageAdjustment;
  onChange: (newAdj: ImageAdjustment) => void;
  aspectRatio?: number;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  image,
  adjustment,
  onChange,
  aspectRatio = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  // Load HTMLImageElement once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.src;
    img.onload = () => setImgObj(img);
  }, [image.src]);

  // Render preview canvas whenever parameters change
  useEffect(() => {
    if (!canvasRef.current || !imgObj || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use container dimensions for preview rendering
    const rect = containerRef.current.getBoundingClientRect();
    const previewWidth = rect.width || 400;
    const previewHeight = previewWidth / aspectRatio;

    canvas.width = Math.round(previewWidth);
    canvas.height = Math.round(previewHeight);

    // Smooth rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (adjustment.fitMode === 'fit') {
      ctx.fillStyle = adjustment.bgColor || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const { dx, dy, drawWidth, drawHeight } = calculateDrawParams(
      imgObj.naturalWidth,
      imgObj.naturalHeight,
      previewWidth,
      previewHeight,
      adjustment
    );

    ctx.drawImage(imgObj, dx, dy, drawWidth, drawHeight);

    // Overlay Safe Zone Guide if enabled
    if (adjustment.showSafeZone) {
      const topHeight = previewHeight * 0.14;
      const bottomHeight = previewHeight * 0.14;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Translucent red
      ctx.fillRect(0, 0, previewWidth, topHeight);
      ctx.fillRect(0, previewHeight - bottomHeight, previewWidth, bottomHeight);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Top line
      ctx.beginPath();
      ctx.moveTo(0, topHeight);
      ctx.lineTo(previewWidth, topHeight);
      ctx.stroke();

      // Bottom line
      ctx.beginPath();
      ctx.moveTo(0, previewHeight - bottomHeight);
      ctx.lineTo(previewWidth, previewHeight - bottomHeight);
      ctx.stroke();

      ctx.setLineDash([]);

      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('STORY SAFE ZONE (TOP)', 8, topHeight - 6);
      ctx.fillText('STORY SAFE ZONE (BOTTOM)', 8, previewHeight - 8);
    }
  }, [imgObj, adjustment, aspectRatio]);

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOffset({ x: adjustment.offsetX, y: adjustment.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const rect = containerRef.current.getBoundingClientRect();

    // Scale mouse movement to normalized offset range (-1 to 1)
    const normDeltaX = (deltaX / (rect.width * 0.5));
    const normDeltaY = (deltaY / (rect.height * 0.5));

    const newOffsetX = Math.max(-1, Math.min(1, initialOffset.x + normDeltaX));
    const newOffsetY = Math.max(-1, Math.min(1, initialOffset.y + normDeltaY));

    onChange({
      ...adjustment,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setInitialOffset({ x: adjustment.offsetX, y: adjustment.offsetY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || !containerRef.current) return;

    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;

    const rect = containerRef.current.getBoundingClientRect();
    const normDeltaX = (deltaX / (rect.width * 0.5));
    const normDeltaY = (deltaY / (rect.height * 0.5));

    onChange({
      ...adjustment,
      offsetX: Math.max(-1, Math.min(1, initialOffset.x + normDeltaX)),
      offsetY: Math.max(-1, Math.min(1, initialOffset.y + normDeltaY)),
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={`w-full max-w-lg aspect-square relative rounded-2xl overflow-hidden border-2 transition-colors cursor-grab select-none shadow-2xl bg-black ${
          isDragging ? 'border-orange-500 cursor-grabbing' : 'border-gray-800 hover:border-gray-700'
        }`}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain block" />

        {/* Drag Hint Overlay */}
        <div className="absolute top-3 left-3 bg-gray-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800 text-[11px] text-gray-300 flex items-center gap-1.5 pointer-events-none">
          <Move className="w-3.5 h-3.5 text-orange-400" />
          <span>Click & Drag to Reposition</span>
        </div>
      </div>
    </div>
  );
};
