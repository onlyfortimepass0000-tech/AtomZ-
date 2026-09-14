import { describe, it, expect } from 'vitest';
import { parseCatalogRows, applyPricingRule, roundPrice } from './priceBatch';

describe('PriceBatch Engine', () => {
  it('parses catalog spreadsheet rows cleanly', () => {
    const raw = [
      { SKU: 'TEE-101', Product: 'Oversized Tee', Cost: 500, Price: 1299 },
    ];
    const items = parseCatalogRows(raw);
    expect(items.length).toBe(1);
    expect(items[0].oldPrice).toBe(1299);
    expect(items[0].cost).toBe(500);
  });

  it('applies percentage increase rule correctly', () => {
    const items = [
      { id: '1', sku: 'TEE-101', productName: 'Tee', category: '', collection: '', variant: '', cost: 500, oldPrice: 1000, newPrice: 1000, changeAmount: 0, flags: [] },
    ];
    const updated = applyPricingRule(items, { type: 'INCREASE_PCT', value: 10 });
    expect(updated[0].newPrice).toBe(1100);
    expect(updated[0].changeAmount).toBe(100);
  });

  it('applies markup on cost rule', () => {
    const items = [
      { id: '1', sku: 'TEE-101', productName: 'Tee', category: '', collection: '', variant: '', cost: 500, oldPrice: 1299, newPrice: 1299, changeAmount: 0, flags: [] },
    ];
    const updated = applyPricingRule(items, { type: 'MARKUP_COST', value: 60 });
    expect(updated[0].newPrice).toBe(800); // 500 * 1.6
  });

  it('rounds prices to ending 99', () => {
    expect(roundPrice(1340, 'ENDING_99')).toBe(1399);
  });
});
