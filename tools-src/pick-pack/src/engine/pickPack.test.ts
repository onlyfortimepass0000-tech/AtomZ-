import { describe, it, expect } from 'vitest';
import { parseAndGroupOrders, sortPickingList } from './pickPack';

describe('PickPack Engine', () => {
  it('aggregates quantities by SKU across multiple orders', () => {
    const rawOrders = [
      { 'Order ID': 'ORD-1', SKU: 'TEE-BLK-M', Product: 'Black Tee', Quantity: 1, Customer: 'Rahul' },
      { 'Order ID': 'ORD-2', SKU: 'TEE-BLK-M', Product: 'Black Tee', Quantity: 2, Customer: 'Priya' },
      { 'Order ID': 'ORD-3', SKU: 'TEE-BLK-M', Product: 'Black Tee', Quantity: 1, Customer: 'Amit' },
      { 'Order ID': 'ORD-3', SKU: 'HOOD-GRY-L', Product: 'Hoodie', Quantity: 1, Customer: 'Amit' },
    ];

    const { pickingList, packingOrders } = parseAndGroupOrders(rawOrders);
    expect(pickingList.length).toBe(2);
    
    const blkItem = pickingList.find(i => i.sku === 'TEE-BLK-M')!;
    expect(blkItem.totalQuantity).toBe(4);

    expect(packingOrders.length).toBe(3); // ORD-1, ORD-2, ORD-3
    const ord3 = packingOrders.find(o => o.orderId === 'ORD-3')!;
    expect(ord3.items.length).toBe(2);
  });

  it('sorts picking list by SKU, Product, or Bin Location', () => {
    const items = [
      { sku: 'TEE-WHT', productName: 'White Tee', variant: '', binLocation: 'B-02', totalQuantity: 2, checked: false },
      { sku: 'HOOD-BLK', productName: 'Black Hoodie', variant: '', binLocation: 'A-01', totalQuantity: 1, checked: false },
    ];

    const sortedByBin = sortPickingList(items, 'BIN');
    expect(sortedByBin[0].sku).toBe('HOOD-BLK');

    const sortedBySku = sortPickingList(items, 'SKU');
    expect(sortedBySku[0].sku).toBe('HOOD-BLK');
  });
});
