import { describe, it, expect } from 'vitest';
import { reconcileModeA, reconcileModeB } from './stockSync';

describe('StockSync Engine', () => {
  it('reconciles Mode A (Opening - Sold + Returned)', () => {
    const opening = [
      { SKU: 'TEE-BLK-M', Product: 'Black Tee M', Stock: 20 },
      { SKU: 'TEE-WHT-L', Product: 'White Tee L', Stock: 15 },
    ];
    const sales = [
      { SKU: 'TEE-BLK-M', Quantity: 5 },
      { SKU: 'TEE-BLK-M', Quantity: 2 },
    ];
    const returns = [
      { SKU: 'TEE-WHT-L', Quantity: 1 },
    ];

    const { items, summary } = reconcileModeA(opening, sales, returns);
    expect(summary.totalSkusEvaluated).toBe(2);
    
    const blk = items.find(i => i.sku === 'TEE-BLK-M')!;
    expect(blk.soldQuantity).toBe(7);
    expect(blk.expectedStock).toBe(13);

    const wht = items.find(i => i.sku === 'TEE-WHT-L')!;
    expect(wht.returnedQuantity).toBe(1);
    expect(wht.expectedStock).toBe(16);
  });

  it('reconciles Mode B (Physical Audit vs System Stock)', () => {
    const system = [
      { SKU: 'TEE-BLK-M', Product: 'Black Tee M', Stock: 18 },
      { SKU: 'TEE-WHT-L', Product: 'White Tee L', Stock: 10 },
    ];
    const physical = [
      { SKU: 'TEE-BLK-M', Quantity: 14 },
      { SKU: 'TEE-WHT-L', Quantity: 10 },
      { SKU: 'HOOD-GRY-M', Quantity: 3 },
    ];

    const { items, summary } = reconcileModeB(system, physical);
    expect(summary.totalSkusEvaluated).toBe(3);
    
    const blk = items.find(i => i.sku === 'TEE-BLK-M')!;
    expect(blk.difference).toBe(-4);
    expect(blk.status).toBe('DISCREPANCY');

    const wht = items.find(i => i.sku === 'TEE-WHT-L')!;
    expect(wht.difference).toBe(0);
    expect(wht.status).toBe('MATCH');

    const hood = items.find(i => i.sku === 'HOOD-GRY-M')!;
    expect(hood.status).toBe('MISSING_IN_SYSTEM');
  });
});
