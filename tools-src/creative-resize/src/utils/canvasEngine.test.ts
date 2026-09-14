import { describe, it, expect } from 'vitest';
import { calculateDrawParams } from './canvasEngine';
import { ImageAdjustment } from '../types';
import { PLATFORM_PRESETS } from '../constants/presets';

describe('Canvas Engine Math', () => {
  const defaultAdj: ImageAdjustment = {
    offsetX: 0,
    offsetY: 0,
    zoom: 1.0,
    fitMode: 'crop',
    bgColor: '#000000',
    showSafeZone: false,
  };

  it('calculates crop cover dimensions correctly for square image to story (1080x1920)', () => {
    // 1000x1000 square image into 1080x1920 target
    const params = calculateDrawParams(1000, 1000, 1080, 1920, defaultAdj);

    // Height requires 1.92 scale (1920px), width becomes 1920px
    expect(params.drawWidth).toBe(1920);
    expect(params.drawHeight).toBe(1920);
    expect(params.dx).toBe((1080 - 1920) / 2); // -420 (centered horizontally)
    expect(params.dy).toBe(0); // 0 (covers height exactly)
  });

  it('calculates fit contain dimensions correctly for square image to story (1080x1920)', () => {
    const fitAdj: ImageAdjustment = { ...defaultAdj, fitMode: 'fit' };
    const params = calculateDrawParams(1000, 1000, 1080, 1920, fitAdj);

    // Fits width (1080px), height becomes 1080px
    expect(params.drawWidth).toBe(1080);
    expect(params.drawHeight).toBe(1080);
    expect(params.dx).toBe(0);
    expect(params.dy).toBe((1920 - 1080) / 2); // 420 (centered vertically)
  });

  it('applies panning offsets correctly', () => {
    const pannedAdj: ImageAdjustment = {
      ...defaultAdj,
      offsetX: 1, // Pan all the way right
      offsetY: 0,
    };
    const params = calculateDrawParams(1000, 1000, 1080, 1920, pannedAdj);
    // dx should be shifted right
    expect(params.dx).toBeGreaterThan((1080 - 1920) / 2);
  });

  it('validates preset aspect ratios match their width and height', () => {
    PLATFORM_PRESETS.forEach((preset) => {
      expect(preset.aspectRatio).toBeCloseTo(preset.width / preset.height, 5);
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    });
  });
});
