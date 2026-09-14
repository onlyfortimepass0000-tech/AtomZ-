import JSZip from 'jszip';
import { ExportConfig, ImageAdjustment, PlatformPreset } from '../types';
import { renderImageToCanvas, exportCanvasToBlob } from './canvasEngine';
import { generateFilename } from './filename';

export interface ProgressCallback {
  (current: number, total: number, currentPresetName: string): void;
}

/**
 * Renders and packages all selected presets into a downloadable ZIP file.
 */
export async function generatePresetsZip(
  img: HTMLImageElement,
  presets: PlatformPreset[],
  adjustment: ImageAdjustment,
  config: ExportConfig,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    if (onProgress) {
      onProgress(i + 1, presets.length, preset.name);
    }

    const canvas = renderImageToCanvas(
      img,
      preset.width,
      preset.height,
      adjustment
    );

    const blob = await exportCanvasToBlob(canvas, config.format, config.quality);
    const fileName = generateFilename(
      config.campaignName,
      preset.platform,
      preset.name,
      preset.width,
      preset.height,
      config.format
    );

    zip.file(fileName, blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE', // Images are already compressed
  });

  return zipBlob;
}

/**
 * Triggers browser file download from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
