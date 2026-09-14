import { describe, it, expect } from 'vitest';
import { generateCartesianProduct, generateVariants, findMissingCombinations } from './combinator';
import { getAbbreviation, detectAbbreviationConflicts } from './abbreviations';
import { generateSku } from './skuGenerator';
import { validateVariants } from './validator';
import { applyBulkEdit } from './bulkEditor';
import { buildShopifyRows, sanitizeFilename } from './exporter';
import { OptionGroup, SkuSettings, ProductDetails } from '../types/variant';

describe('VariantForge Engine', () => {
  const sampleOptionGroups: OptionGroup[] = [
    {
      id: 'g1',
      name: 'Color',
      values: [
        { id: 'v1', value: 'Black' },
        { id: 'v2', value: 'White' },
        { id: 'v3', value: 'Navy' },
      ],
    },
    {
      id: 'g2',
      name: 'Size',
      values: [
        { id: 'v4', value: 'Small' },
        { id: 'v5', value: 'Medium' },
        { id: 'v6', value: 'Large' },
        { id: 'v7', value: 'Extra Large' },
      ],
    },
  ];

  const defaultSkuSettings: SkuSettings = {
    separator: '-',
    casing: 'UPPERCASE',
    useAbbreviations: true,
    customAbbreviations: {},
  };

  const sampleProduct: ProductDetails = {
    productName: 'Oversized Tee',
    baseSku: 'OT',
    price: 1299,
  };

  it('generates 3 colors x 4 sizes = 12 variants', () => {
    const combos = generateCartesianProduct(sampleOptionGroups);
    expect(combos).toHaveLength(12);

    const variants = generateVariants(sampleProduct, sampleOptionGroups, defaultSkuSettings);
    expect(variants).toHaveLength(12);
    expect(variants[0].title).toBe('Black / Small');
    expect(variants[0].sku).toBe('OT-BLK-S');
  });

  it('handles standard abbreviations correctly', () => {
    expect(getAbbreviation('Black')).toBe('BLK');
    expect(getAbbreviation('White')).toBe('WHT');
    expect(getAbbreviation('Navy')).toBe('NVY');
    expect(getAbbreviation('Small')).toBe('S');
    expect(getAbbreviation('Medium')).toBe('M');
    expect(getAbbreviation('Large')).toBe('L');
    expect(getAbbreviation('Extra Large')).toBe('XL');
  });

  it('detects abbreviation conflicts when distinct values generate identical abbreviations', () => {
    const values = ['Light Blue', 'Light Brown'];
    const conflicts = detectAbbreviationConflicts(values);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].abbreviation).toBe('LB');
  });

  it('validates duplicate SKUs and flags NEEDS_FIX', () => {
    const variants = generateVariants(sampleProduct, sampleOptionGroups, defaultSkuSettings);
    variants[1].sku = variants[0].sku; // Force duplicate SKU

    const validated = validateVariants(variants, sampleProduct);
    expect(validated[0].status).toBe('NEEDS_FIX');
    expect(validated[1].status).toBe('NEEDS_FIX');
    expect(validated[0].validationErrors).toContain(`Duplicate SKU "${variants[0].sku}"`);
  });

  it('applies bulk price modification to specific option values', () => {
    const variants = generateVariants(sampleProduct, sampleOptionGroups, defaultSkuSettings);

    // Add ₹100 to Extra Large sizes
    const updated = applyBulkEdit(variants, {
      action: 'ADD_PRICE_DELTA',
      targetValue: 100,
      targetOptionName: 'Size',
      targetOptionValue: 'Extra Large',
    });

    const xlVariant = updated.find(v => v.options['Size'] === 'Extra Large');
    const smallVariant = updated.find(v => v.options['Size'] === 'Small');

    expect(xlVariant?.price).toBe(1399);
    expect(smallVariant?.price).toBe(1299);
  });

  it('identifies missing combinations when existing variants are provided', () => {
    const variants = generateVariants(sampleProduct, sampleOptionGroups, defaultSkuSettings);
    // Remove 2 variants
    const partialVariants = variants.slice(2);

    const missing = findMissingCombinations(partialVariants, sampleOptionGroups);
    expect(missing).toHaveLength(2);
  });

  it('maps Shopify export rows correctly', () => {
    const variants = generateVariants(sampleProduct, sampleOptionGroups, defaultSkuSettings);
    const shopifyRows = buildShopifyRows(variants, 'Oversized Tee', sampleOptionGroups);

    expect(shopifyRows[0]['Handle']).toBe('oversized-tee');
    expect(shopifyRows[0]['Title']).toBe('Oversized Tee');
    expect(shopifyRows[0]['Option1 Name']).toBe('Color');
    expect(shopifyRows[0]['Option1 Value']).toBe('Black');
    expect(shopifyRows[0]['Option2 Name']).toBe('Size');
    expect(shopifyRows[0]['Option2 Value']).toBe('Small');
  });

  it('sanitizes export filenames correctly', () => {
    expect(sanitizeFilename('Oversized Tee!!!', '_variants', '.csv')).toBe('oversized-tee_variants.csv');
    expect(sanitizeFilename('  Summer Collection 2026 ', '_shopify', '.csv')).toBe('summer-collection-2026_shopify.csv');
  });
});
