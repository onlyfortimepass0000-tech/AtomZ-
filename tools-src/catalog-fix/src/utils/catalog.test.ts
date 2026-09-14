import { describe, it, expect } from 'vitest';
import { autoMatchColumns, normalizeHeader } from './columnMatcher';
import {
  cleanPrice,
  normalizeAvailability,
  normalizeCondition,
  stripHtmlTags,
  cleanProductUrl,
} from './normalizers';
import { validateAndProcessCatalog } from './validator';
import { PLATFORM_SPECS } from '../constants/platforms';
import { ColumnMapping } from '../types';

describe('CatalogFix Core Engine Tests', () => {
  it('normalizes headers for column matching', () => {
    expect(normalizeHeader('Product Title')).toBe('producttitle');
    expect(normalizeHeader('Colour')).toBe('colour');
    expect(normalizeHeader('SKU_ID')).toBe('skuid');
  });

  it('matches common source columns to Meta catalog fields', () => {
    const sourceHeaders = ['Product Name', 'Stock', 'Image URL', 'Price (INR)', 'Variant SKU'];
    const mapping = autoMatchColumns(sourceHeaders, PLATFORM_SPECS.meta.fields);

    expect(mapping['title']).toBe('Product Name');
    expect(mapping['availability']).toBe('Stock');
    expect(mapping['image_link']).toBe('Image URL');
    expect(mapping['price']).toBe('Price (INR)');
    expect(mapping['id']).toBe('Variant SKU');
  });

  it('safely strips currency symbols and cleans prices', () => {
    expect(cleanPrice('₹ 1,299.00')).toBe('1299.00');
    expect(cleanPrice('$49.99')).toBe('49.99');
    expect(cleanPrice('1200')).toBe('1200.00');
    expect(cleanPrice('Free')).toBe('Free'); // Preserves non-numeric for validation flagging
  });

  it('normalizes availability values accurately', () => {
    expect(normalizeAvailability('in stock')).toBe('in stock');
    expect(normalizeAvailability('yes')).toBe('in stock');
    expect(normalizeAvailability('available')).toBe('in stock');
    expect(normalizeAvailability('sold out')).toBe('out of stock');
    expect(normalizeAvailability('0')).toBe('out of stock');
    expect(normalizeAvailability('no')).toBe('out of stock');
  });

  it('strips accidental HTML tags from product descriptions', () => {
    const html = '<p>Super <b>soft</b> cotton shirt.</p>';
    expect(stripHtmlTags(html)).toBe('Super soft cotton shirt.');
  });

  it('cleans malformed product URLs', () => {
    expect(cleanProductUrl(' brand.com/shoes ')).toBe('https://brand.com/shoes');
    expect(cleanProductUrl('http://shop.com/item')).toBe('http://shop.com/item');
  });

  it('detects duplicate product IDs and flags missing required fields', () => {
    const rawRows = [
      { Title: 'Item 1', SKU: 'SKU-100', Price: '₹999', Image: 'https://brand.com/1.jpg', Link: 'https://brand.com/1' },
      { Title: 'Item 2', SKU: 'SKU-100', Price: '₹499', Image: 'https://brand.com/2.jpg', Link: 'https://brand.com/2' }, // Duplicate SKU
      { Title: '', SKU: 'SKU-102', Price: '₹199', Image: 'https://brand.com/3.jpg', Link: 'https://brand.com/3' }, // Missing Title
    ];

    const mapping: ColumnMapping = {
      id: 'SKU',
      title: 'Title',
      price: 'Price',
      image_link: 'Image',
      link: 'Link',
    };

    const processed = validateAndProcessCatalog(rawRows, mapping, PLATFORM_SPECS.meta);

    expect(processed.length).toBe(3);
    expect(processed[0].status).toBe('NEEDS_FIX'); // Duplicate SKU-100
    expect(processed[1].status).toBe('NEEDS_FIX'); // Duplicate SKU-100
    expect(processed[2].status).toBe('NEEDS_FIX'); // Missing required Title

    expect(processed[0].issues.some((i) => i.message.includes('Duplicate product ID'))).toBe(true);
    expect(processed[2].issues.some((i) => i.message.includes('Missing required field'))).toBe(true);
  });
});
