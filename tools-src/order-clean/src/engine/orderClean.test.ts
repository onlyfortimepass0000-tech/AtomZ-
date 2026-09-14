import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  normalizeState,
  normalizePaymentMethod,
  normalizePinCode,
  stripInvisibleChars,
  cleanOrderDataset,
  autoMapColumns,
} from './orderClean';

describe('OrderClean Engine', () => {
  it('strips invisible and zero-width characters', () => {
    const dirty = 'Order\u200B123\uFEFF';
    expect(stripInvisibleChars(dirty)).toBe('Order123');
  });

  it('normalizes Indian phone numbers correctly', () => {
    expect(normalizePhone('9876543210')).toEqual({
      value: '+919876543210',
      isFixed: true,
      isValid: true,
      reason: 'Formatted to +91 Indian mobile number',
    });
    expect(normalizePhone('09876543210')).toEqual({
      value: '+919876543210',
      isFixed: true,
      isValid: true,
      reason: 'Stripped leading 0 and added +91',
    });
    expect(normalizePhone('123')).toEqual({
      value: '123',
      isFixed: false,
      isValid: false,
      reason: 'Invalid phone length (3 digits)',
    });
  });

  it('normalizes Indian state names and abbreviations', () => {
    expect(normalizeState('MH')).toEqual({ value: 'Maharashtra', isFixed: true });
    expect(normalizeState('maharastra')).toEqual({ value: 'Maharashtra', isFixed: true });
    expect(normalizeState('DL')).toEqual({ value: 'Delhi', isFixed: true });
  });

  it('normalizes COD and Prepaid payment terminology', () => {
    expect(normalizePaymentMethod('Cash on Delivery')).toEqual({ value: 'COD', isFixed: true });
    expect(normalizePaymentMethod('Online Payment')).toEqual({ value: 'PREPAID', isFixed: true });
  });

  it('pads truncated 5-digit PIN codes with leading zero', () => {
    expect(normalizePinCode('11001')).toEqual({
      value: '011001',
      isFixed: true,
      isValid: true,
      reason: 'Padded truncated leading zero',
    });
    expect(normalizePinCode('400001')).toEqual({
      value: '400001',
      isFixed: false,
      isValid: true,
    });
  });

  it('auto-maps columns and cleans a dataset', () => {
    const headers = ['Order #', 'Buyer Name', 'Mobile', 'State', 'Pincode', 'Payment'];
    const mappings = autoMapColumns(headers);
    
    const rawRows = [
      { 'Order #': 'ORD-101', 'Buyer Name': 'Rahul Sharma', 'Mobile': '9876543210', 'State': 'MH', 'Pincode': '400001', 'Payment': 'Cash on Delivery' },
      { 'Order #': 'ORD-102', 'Buyer Name': 'Priya Singh', 'Mobile': '123', 'State': 'DL', 'Pincode': '11001', 'Payment': 'Online' },
    ];

    const result = cleanOrderDataset(rawRows, mappings);
    expect(result.summary.totalRowsChecked).toBe(2);
    expect(result.cleanedRows[0]['Phone']).toBe('+919876543210');
    expect(result.cleanedRows[0]['State']).toBe('Maharashtra');
    expect(result.cleanedRows[0]['Payment Method']).toBe('COD');
    expect(result.cleanedRows[1]['PIN Code']).toBe('011001');
    expect(result.attentionItems.length).toBe(1); // invalid phone for ORD-102
  });
});
