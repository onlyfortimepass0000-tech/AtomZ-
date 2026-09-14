import { describe, it, expect } from 'vitest';
import {
  processUrlLine,
  processBulkUrls,
  sanitizeUtmValue,
  generateCSVContent,
} from './utmEngine';
import { NamingRules, UTMConfig } from '../types';

describe('UTM Engine Unit Tests', () => {
  const defaultRules: NamingRules = {
    spaceReplacement: 'underscore',
    forceLowercase: true,
    removeSpecialChars: true,
    existingUtmHandling: 'replace',
  };

  const defaultUtm: UTMConfig = {
    source: 'instagram',
    medium: 'social',
    campaign: 'Summer Sale 2026',
    content: 'hero banner',
    term: 'running shoes',
  };

  it('sanitizes parameter values correctly with underscores and lowercase', () => {
    expect(sanitizeUtmValue('Summer Sale 2026!', defaultRules)).toBe('summer_sale_2026');
  });

  it('sanitizes parameter values with hyphens when selected', () => {
    const hyphenRules: NamingRules = { ...defaultRules, spaceReplacement: 'hyphen' };
    expect(sanitizeUtmValue('Summer Sale 2026!', hyphenRules)).toBe('summer-sale-2026');
  });

  it('parses valid URL line and appends encoded UTM parameters', () => {
    const item = processUrlLine('https://brand.com/shoes', 0, defaultUtm, defaultRules);
    expect(item.isValid).toBe(true);
    expect(item.generatedUrl).toContain('https://brand.com/shoes?');
    expect(item.generatedUrl).toContain('utm_source=instagram');
    expect(item.generatedUrl).toContain('utm_medium=social');
    expect(item.generatedUrl).toContain('utm_campaign=summer_sale_2026');
  });

  it('automatically adds https protocol to domain-only URLs', () => {
    const item = processUrlLine('brand.com/sale', 0, defaultUtm, defaultRules);
    expect(item.isValid).toBe(true);
    expect(item.generatedUrl).toContain('https://brand.com/sale?');
  });

  it('handles invalid URLs gracefully', () => {
    const item = processUrlLine('ht tp://invalid url %%', 0, defaultUtm, defaultRules);
    expect(item.isValid).toBe(false);
    expect(item.errorMessage).toBeDefined();
  });

  it('replaces existing UTM parameters when replace rule is set', () => {
    const oldUrl = 'https://brand.com/shoes?utm_source=old_source&utm_medium=old_medium';
    const item = processUrlLine(oldUrl, 0, defaultUtm, defaultRules);
    expect(item.generatedUrl).toContain('utm_source=instagram');
    expect(item.generatedUrl).not.toContain('old_source');
  });

  it('detects duplicate generated URLs in bulk list', () => {
    const rawText = `https://brand.com/shoes\nhttps://brand.com/shoes`;
    const items = processBulkUrls(rawText, defaultUtm, defaultRules);
    expect(items.length).toBe(2);
    expect(items[0].isDuplicate).toBe(false);
    expect(items[1].isDuplicate).toBe(true);
  });

  it('generates properly formatted CSV string', () => {
    const items = processBulkUrls('https://brand.com/shoes', defaultUtm, defaultRules);
    const csv = generateCSVContent(items);
    expect(csv).toContain('Original URL,Source,Medium,Campaign');
    expect(csv).toContain('"https://brand.com/shoes"');
    expect(csv).toContain('"instagram"');
  });
});
