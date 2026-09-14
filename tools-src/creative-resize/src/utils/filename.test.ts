import { describe, it, expect } from 'vitest';
import { sanitizeSlug, generateFilename, getFormatExtension } from './filename';

describe('Filename Utilities', () => {
  it('sanitizes strings properly for slugs', () => {
    expect(sanitizeSlug('Summer Sale 2026!')).toBe('summer-sale-2026');
    expect(sanitizeSlug('  Special  --  Offer!!  ')).toBe('special-offer');
    expect(sanitizeSlug('Black_Friday')).toBe('black-friday');
  });

  it('gets correct extensions for mime formats', () => {
    expect(getFormatExtension('image/jpeg')).toBe('jpg');
    expect(getFormatExtension('image/png')).toBe('png');
    expect(getFormatExtension('image/webp')).toBe('webp');
  });

  it('generates sanitized output filename correctly', () => {
    const filename = generateFilename(
      'Summer Sale!',
      'Instagram',
      'Story / Reel',
      1080,
      1920,
      'image/jpeg'
    );
    expect(filename).toBe('summer-sale_instagram-story-reel_1080x1920.jpg');
  });

  it('uses fallback campaign name when empty', () => {
    const filename = generateFilename(
      '   ',
      'LinkedIn',
      'Landscape',
      1200,
      627,
      'image/png'
    );
    expect(filename).toBe('creative_linkedin-landscape_1200x627.png');
  });
});
