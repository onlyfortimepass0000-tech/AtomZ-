import { ExportFormat } from '../types';

/**
 * Sanitizes a string to be filesystem-safe.
 */
export function sanitizeSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Maps MIME format to file extension.
 */
export function getFormatExtension(format: ExportFormat): string {
  switch (format) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
    default:
      return 'png';
  }
}

/**
 * Generates standardized filename for exported creative.
 * Format: {campaign}_{platform}-{preset-name}_{width}x{height}.{ext}
 */
export function generateFilename(
  campaignName: string,
  platform: string,
  presetName: string,
  width: number,
  height: number,
  format: ExportFormat
): string {
  const cleanCampaign = sanitizeSlug(campaignName) || 'creative';
  const cleanPlatform = sanitizeSlug(platform);
  const cleanPreset = sanitizeSlug(presetName);
  const ext = getFormatExtension(format);

  const formatTag = cleanPlatform ? `${cleanPlatform}-${cleanPreset}` : cleanPreset;
  return `${cleanCampaign}_${formatTag}_${width}x${height}.${ext}`;
}
