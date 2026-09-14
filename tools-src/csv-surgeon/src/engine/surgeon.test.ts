import { describe, it, expect } from 'vitest';
import { cleanWhitespace } from './cleaners/whitespace';
import { cleanPrice } from './cleaners/prices';
import { normalizeAvailability } from './cleaners/availability';
import { cleanUrl } from './cleaners/urls';
import { autoMapHeader } from './cleaners/headers';
import { stripHtmlTags } from './cleaners/text';
import { analyzeAndScanDataset, executeBatchPatternFix } from './repairEngine';

describe('CSV Surgeon Repair Engine', () => {
  it('cleans whitespace and hidden characters', () => {
    const res = cleanWhitespace('\uFEFF  Oversized Tee  \r\n');
    expect(res.cleaned).toBe('Oversized Tee');
    expect(res.changed).toBe(true);
  });

  it('cleans currency symbols and comma formatting from prices', () => {
    const p1 = cleanPrice('₹1,299');
    expect(p1.cleaned).toBe('1299');
    expect(p1.changed).toBe(true);
    expect(p1.isValid).toBe(true);

    const p2 = cleanPrice('$2,499.50');
    expect(p2.cleaned).toBe('2499.50');
    expect(p2.changed).toBe(true);

    const p3 = cleanPrice('Rs. 450');
    expect(p3.cleaned).toBe('450');
  });

  it('normalizes availability wording synonyms', () => {
    const a1 = normalizeAvailability('YES', 'SHOPIFY');
    expect(a1.cleaned).toBe('in_stock');
    expect(a1.changed).toBe(true);

    const a2 = normalizeAvailability('available', 'META');
    expect(a2.cleaned).toBe('in stock');
    expect(a2.changed).toBe(true);

    const a3 = normalizeAvailability('0', 'SHOPIFY');
    expect(a3.cleaned).toBe('out_of_stock');
  });

  it('encodes spaces in URLs and infers missing https:// protocols', () => {
    const u1 = cleanUrl(' https://brand.com/images/tee photo.jpg ');
    expect(u1.cleaned).toBe('https://brand.com/images/tee%20photo.jpg');
    expect(u1.changed).toBe(true);

    const u2 = cleanUrl('brand.com/products/shoes');
    expect(u2.cleaned).toBe('https://brand.com/products/shoes');
    expect(u2.changed).toBe(true);
  });

  it('maps header aliases to destination target headers', () => {
    expect(autoMapHeader('Product Name', 'SHOPIFY').mapped).toBe('Title');
    expect(autoMapHeader('Colour', 'META').mapped).toBe('color');
    expect(autoMapHeader('SKU Number', 'GENERIC').mapped).toBe('SKU');
  });

  it('strips HTML tags from text descriptions', () => {
    const ht = stripHtmlTags('<p>High quality <span>cotton</span> tee</p>');
    expect(ht.cleaned).toBe('High quality cotton tee');
    expect(ht.changed).toBe(true);
  });

  it('scans a broken dataset and groups pattern issues', () => {
    const headers = ['Product Name', 'SKU', 'Price', 'Stock'];
    const rows = [
      { 'Product Name': 'Tee 1', 'SKU': 'T1', 'Price': '₹1,299', 'Stock': 'YES' },
      { 'Product Name': 'Tee 2', 'SKU': 'T2', 'Price': '₹1,499', 'Stock': 'YES' },
    ];

    const result = analyzeAndScanDataset(headers, rows, 'SHOPIFY');

    expect(result.headers).toContain('Title'); // Header alias mapped
    expect(result.autoFixableCount).toBeGreaterThan(0);
    expect(result.patternGroups.length).toBeGreaterThan(0);

    const stockPattern = result.patternGroups.find(p => p.patternKey === 'AVAILABILITY:YES');
    expect(stockPattern).toBeDefined();
    expect(stockPattern?.affectedRowsCount).toBe(2);
  });

  it('executes batch 1-click pattern fixes across multiple rows', () => {
    const headers = ['Title', 'SKU', 'Price', 'Variant Inventory Qty'];
    const rows = [
      { Title: 'Tee 1', SKU: 'T1', Price: '1299', 'Variant Inventory Qty': 'YES' },
      { Title: 'Tee 2', SKU: 'T2', Price: '1499', 'Variant Inventory Qty': 'YES' },
    ];

    const scan = analyzeAndScanDataset(headers, rows, 'SHOPIFY');
    const stockPattern = scan.patternGroups.find(p => p.patternKey === 'AVAILABILITY:YES');

    if (stockPattern) {
      const fixed = executeBatchPatternFix(stockPattern.patternKey, scan.rows, scan.issues);
      expect(fixed.updatedRows[0]['Variant Inventory Qty']).toBe('in_stock');
      expect(fixed.updatedRows[1]['Variant Inventory Qty']).toBe('in_stock');
    }
  });
});
