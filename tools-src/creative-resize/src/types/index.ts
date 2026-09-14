export interface SafeZoneGuide {
  topPct: number;     // e.g. 14% for IG Stories top header bar
  bottomPct: number;  // e.g. 14% for IG Stories bottom reply bar
  leftPct: number;
  rightPct: number;
  label: string;
}

export interface PlatformPreset {
  id: string;
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'YouTube' | 'X (Twitter)' | 'WhatsApp' | 'Google Display' | 'Custom';
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  hasSafeZone: boolean;
  safeZone?: SafeZoneGuide;
  isCustom?: boolean;
}

export type FitMode = 'crop' | 'fit';

export interface ImageAdjustment {
  offsetX: number; // -1 to 1 offset percentage from center
  offsetY: number; // -1 to 1 offset percentage from center
  zoom: number;    // 0.5 to 3.0 scale multiplier
  fitMode: FitMode;
  bgColor: string; // Hex color code when fitMode === 'fit'
  showSafeZone: boolean;
}

export type ExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ExportConfig {
  format: ExportFormat;
  quality: number; // 0.1 to 1.0
  campaignName: string;
}

export interface LoadedImage {
  file: File;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
}
