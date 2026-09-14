import { OutputFormat, ProcessingOptions, ProcessedImage } from '../types/imagePack';

export function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9_-]/gi, '_')
    .replace(/_+/g, '_')
    .toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileExtension(mimeType: OutputFormat): string {
  switch (mimeType) {
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/jpeg':
    default: return 'jpg';
  }
}

export function generateNewFilename(
  originalName: string,
  index: number,
  sku: string,
  options: ProcessingOptions
): string {
  const ext = getFileExtension(options.outputFormat);
  const numStr = String(index + 1).padStart(2, '0');
  const cleanSku = sku ? sanitizeFilename(sku) : (options.customPrefix ? sanitizeFilename(options.customPrefix) : 'PRODUCT');
  const cleanOrig = sanitizeFilename(originalName);

  switch (options.namingPattern) {
    case 'SKU_NUMBER':
      return `${cleanSku}_${numStr}.${ext}`;
    case 'PRODUCT_NUMBER':
      return `${cleanSku}_PROD_${numStr}.${ext}`;
    case 'SKU_PRODUCT_NUMBER':
      return `${cleanSku}_${cleanOrig}_${numStr}.${ext}`;
    case 'ORIGINAL_SANITIZED':
    default:
      return `${cleanOrig}_${numStr}.${ext}`;
  }
}

export async function processSingleImage(
  file: File,
  index: number,
  sku: string,
  options: ProcessingOptions
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (options.maxDimension !== 'ORIGINAL') {
        const max = parseInt(options.maxDimension, 10);
        if (img.width > max || img.height > max) {
          if (img.width >= img.height) {
            targetWidth = max;
            targetHeight = Math.round((img.height * max) / img.width);
          } else {
            targetHeight = max;
            targetWidth = Math.round((img.width * max) / img.height);
          }
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return reject(new Error('Canvas context unavailable'));
      }

      // If output format is JPEG, paint white background for transparent PNG source
      if (options.outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) return reject(new Error('Image blob compression failed'));

          const newName = generateNewFilename(file.name, index, sku, options);
          const previewUrl = URL.createObjectURL(blob);

          resolve({
            id: `img_${index}_${Date.now()}`,
            originalName: file.name,
            originalSize: file.size,
            originalWidth: img.width,
            originalHeight: img.height,
            newName,
            newSize: blob.size,
            newWidth: targetWidth,
            newHeight: targetHeight,
            sku: sku || 'N/A',
            blob,
            previewUrl,
          });
        },
        options.outputFormat,
        options.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image ${file.name}`));
    };

    img.src = objectUrl;
  });
}

export function generateManifestCsv(processed: ProcessedImage[]): string {
  const headers = ['Original Filename', 'New Filename', 'SKU', 'Original Size (Bytes)', 'New Size (Bytes)', 'Dimensions'];
  const rows = processed.map(p => [
    `"${p.originalName.replace(/"/g, '""')}"`,
    `"${p.newName.replace(/"/g, '""')}"`,
    `"${p.sku.replace(/"/g, '""')}"`,
    p.originalSize,
    p.newSize,
    `"${p.newWidth}x${p.newHeight}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
