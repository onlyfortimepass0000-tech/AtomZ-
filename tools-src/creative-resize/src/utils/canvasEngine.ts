import { ExportFormat, ImageAdjustment } from '../types';

export interface DrawParams {
  dx: number;
  dy: number;
  drawWidth: number;
  drawHeight: number;
}

/**
 * Computes draw placement math for an image on a target canvas given zoom, pan, and fit mode.
 */
export function calculateDrawParams(
  imgWidth: number,
  imgHeight: number,
  targetWidth: number,
  targetHeight: number,
  adjustment: ImageAdjustment
): DrawParams {
  const { offsetX, offsetY, zoom, fitMode } = adjustment;

  if (fitMode === 'crop') {
    // Fill mode (Cover target canvas)
    const baseScale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight);
    const effectiveScale = baseScale * zoom;

    const drawWidth = imgWidth * effectiveScale;
    const drawHeight = imgHeight * effectiveScale;

    const baseDx = (targetWidth - drawWidth) / 2;
    const baseDy = (targetHeight - drawHeight) / 2;

    const maxPanX = Math.max(0, (drawWidth - targetWidth) / 2);
    const maxPanY = Math.max(0, (drawHeight - targetHeight) / 2);

    const dx = baseDx + offsetX * maxPanX;
    const dy = baseDy + offsetY * maxPanY;

    return { dx, dy, drawWidth, drawHeight };
  } else {
    // Fit mode (Contain within target canvas)
    const baseScale = Math.min(targetWidth / imgWidth, targetHeight / imgHeight);
    const effectiveScale = baseScale * zoom;

    const drawWidth = imgWidth * effectiveScale;
    const drawHeight = imgHeight * effectiveScale;

    const baseDx = (targetWidth - drawWidth) / 2;
    const baseDy = (targetHeight - drawHeight) / 2;

    const maxPanX = Math.abs((targetWidth - drawWidth) / 2);
    const maxPanY = Math.abs((targetHeight - drawHeight) / 2);

    const dx = baseDx + offsetX * maxPanX;
    const dy = baseDy + offsetY * maxPanY;

    return { dx, dy, drawWidth, drawHeight };
  }
}

/**
 * Renders HTMLImageElement to an HTMLCanvasElement with exact target size and styling.
 */
export function renderImageToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  adjustment: ImageAdjustment
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(targetWidth);
  canvas.height = Math.round(targetHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context could not be initialized.');
  }

  // Smooth scaling configuration
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background if fit mode
  if (adjustment.fitMode === 'fit') {
    ctx.fillStyle = adjustment.bgColor || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const { dx, dy, drawWidth, drawHeight } = calculateDrawParams(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    targetWidth,
    targetHeight,
    adjustment
  );

  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

  return canvas;
}

/**
 * Exports canvas content to Blob.
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas export failed to produce blob.'));
          }
        },
        format,
        format === 'image/png' ? undefined : quality
      );
    } catch (err) {
      reject(err);
    }
  });
}
